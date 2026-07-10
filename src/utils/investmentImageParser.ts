import type { AssetType, InvestmentAsset } from "../types";

export interface InvestmentCategoryOcrUpdate {
  category: string;
  assetType: AssetType;
  investedValue: number | null;
  currentValue: number;
  confidence: number;
  sourceText: string;
}

const knownCategories: Array<{ aliases: string[]; category: string; assetType: AssetType }> = [
  { aliases: ["fundos imobiliarios", "fundo imobiliario", "fiis"], category: "Fundos Imobiliários (FIIs)", assetType: "fii" },
  { aliases: ["limite garantido"], category: "Limite Garantido", assetType: "fixed_income" },
  { aliases: ["renda fixa"], category: "Renda Fixa", assetType: "fixed_income" },
  { aliases: ["fundos de investimento", "meus fundos"], category: "Fundos de Investimento", assetType: "fund" },
  { aliases: ["tesouro direto", "tesouro"], category: "Tesouro Direto", assetType: "treasury" },
  { aliases: ["lci lca", "lci", "lca"], category: "LCI / LCA", assetType: "lci_lca" },
  { aliases: ["criptomoedas", "cripto"], category: "Criptomoedas", assetType: "crypto" },
  { aliases: ["acoes", "renda variavel"], category: "Ações", assetType: "stock" },
  { aliases: ["cdbs", "cdb"], category: "CDB", assetType: "cdb" },
  { aliases: ["previdencia"], category: "Previdência", assetType: "fund" },
];

const currentValueLabels = ["valor atual", "saldo bruto", "saldo total", "patrimonio", "total da categoria"];
const investedValueLabels = ["valor aplicado", "saldo aplicado", "total investido", "valor investido", "investido"];
const returnLabels = ["rendimento bruto", "rendimento", "rentabilidade em reais", "resultado"];

export function parseInvestmentCategoryText(text: string, assets: InvestmentAsset[]): InvestmentCategoryOcrUpdate[] {
  const lines = textToLines(text);
  const assetCategories = buildAssetCategoryCandidates(assets);
  const updates = new Map<string, InvestmentCategoryOcrUpdate>();

  lines.forEach((line, index) => {
    const normalizedLine = normalizeText(line);
    const candidate = findCategoryCandidate(normalizedLine, assetCategories);
    if (!candidate) return;

    let windowEnd = Math.min(lines.length, index + 6);
    for (let cursor = index + 1; cursor < windowEnd; cursor += 1) {
      if (findCategoryCandidate(normalizeText(lines[cursor]), assetCategories)) {
        windowEnd = cursor;
        break;
      }
    }
    const windowLines = lines.slice(index, windowEnd);
    const currentValue = findValueByLabels(windowLines, currentValueLabels)
      ?? parseMoneyValues(line)[0]
      ?? windowLines.slice(1).flatMap(parseMoneyValues)[0]
      ?? null;
    if (currentValue === null || currentValue < 0) return;

    const explicitInvested = findValueByLabels(windowLines, investedValueLabels);
    const categoryReturn = findValueByLabels(windowLines, returnLabels);
    const investedValue = explicitInvested ?? (
      typeof categoryReturn === "number" && currentValue >= categoryReturn ? currentValue - categoryReturn : null
    );
    const key = normalizeText(candidate.category);
    const sourceText = windowLines.join(" | ");
    const confidence = explicitInvested !== null || findLineByLabels(windowLines, currentValueLabels) ? 0.95 : 0.88;
    const next = {
      category: candidate.category,
      assetType: candidate.assetType,
      investedValue,
      currentValue,
      confidence,
      sourceText,
    };
    const previous = updates.get(key);
    if (!previous || next.confidence >= previous.confidence) updates.set(key, next);
  });

  return [...updates.values()];
}

function buildAssetCategoryCandidates(assets: InvestmentAsset[]) {
  const candidates = new Map<string, { aliases: string[]; category: string; assetType: AssetType }>();
  assets.forEach((asset) => {
    const category = asset.category?.trim();
    if (!category) return;
    const key = normalizeText(category);
    if (!key || candidates.has(key)) return;
    candidates.set(key, { aliases: [key], category, assetType: asset.assetType });
  });
  return [...candidates.values()];
}

function findCategoryCandidate(line: string, assetCategories: ReturnType<typeof buildAssetCategoryCandidates>) {
  const known = knownCategories.find((candidate) => candidate.aliases.some((alias) => line.includes(alias)));
  if (known) {
    const matchingAssetCategory = assetCategories.find((candidate) =>
      candidate.aliases.some((alias) => line.includes(alias) || alias.includes(normalizeText(known.category))),
    );
    return matchingAssetCategory ?? known;
  }
  return assetCategories.find((candidate) => candidate.aliases.some((alias) => line.includes(alias)));
}

function textToLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function findValueByLabels(lines: string[], labels: string[]) {
  const line = findLineByLabels(lines, labels);
  if (!line) return null;
  const values = parseMoneyValues(line);
  return values[0] ?? null;
}

function findLineByLabels(lines: string[], labels: string[]) {
  return lines.find((line) => labels.some((label) => normalizeText(line).includes(label)));
}

function parseMoneyValues(line: string) {
  const currencyMatches = [...line.matchAll(/R[$S]\s*(-?\s*[0-9.]+(?:,\d{2})?)/gi)].map((match) => match[1]);
  const plainMatches = currencyMatches.length || line.includes("%")
    ? []
    : [...line.matchAll(/(?:^|\s)(-?[0-9]{1,3}(?:\.[0-9]{3})*,\d{2})(?=\s|$)/g)].map((match) => match[1]);
  return [...currencyMatches, ...plainMatches]
    .map(parseOcrMoney)
    .filter((value): value is number => value !== null);
}

function parseOcrMoney(rawValue: string) {
  const raw = rawValue.replace(/\s+/g, "");
  const negative = raw.startsWith("-");
  const unsigned = raw.replace(/^-/, "");
  let normalized = "";
  if (unsigned.includes(",")) normalized = unsigned.replace(/\./g, "").replace(",", ".");
  else {
    const digits = unsigned.replace(/\D/g, "");
    if (!digits) return null;
    normalized = digits.length > 2 ? `${digits.slice(0, -2)}.${digits.slice(-2)}` : digits;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
