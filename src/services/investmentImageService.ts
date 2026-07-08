import type { AssetType, InvestmentAsset } from "../types";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabaseClient";

export interface InvestmentImageUpdate {
  ticker: string;
  name: string | null;
  assetType: AssetType | null;
  quantity: number | null;
  averagePrice: number | null;
  currentPrice: number | null;
  currentValue: number | null;
  dividends: number | null;
  confidence: number;
  sourceText: string;
}

export interface InvestmentImageAnalysis {
  summary: string;
  updates: InvestmentImageUpdate[];
  unmatched: string[];
}

interface FilePayload {
  name: string;
  mimeType: string;
  dataUrl: string;
}

export async function analyzeInvestmentScreenshots(files: File[], assets: InvestmentAsset[]): Promise<InvestmentImageAnalysis> {
  let localError: unknown;
  try {
    const localAnalysis = await analyzeWithLocalOcr(files, assets);
    if (localAnalysis.updates.length) return localAnalysis;
  } catch (error) {
    localError = error;
  }
  const remoteFallbackEnabled = import.meta.env.VITE_ENABLE_REMOTE_IMAGE_AI === "true";
  if (!remoteFallbackEnabled) {
    if (localError) {
      throw new Error("Não consegui carregar o OCR local agora. Verifique a conexão e tente novamente.");
    }
    throw new Error("Não consegui identificar investimentos nesses prints. Recorte a área dos cartões ou envie prints do C6 com Saldo bruto e Rendimento bruto visíveis.");
  }

  if (!isSupabaseConfigured || !supabaseUrl || !supabaseAnonKey) {
    throw new Error("IA de leitura de prints ainda não está conectada ao Supabase neste ambiente.");
  }

  const payloadFiles = await Promise.all(files.map(fileToPayload));
  const response = await fetch(`${supabaseUrl}/functions/v1/investment-screenshot-ai`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      files: payloadFiles,
      holdings: assets.map((asset) => ({
        ticker: normalizeTicker(asset.ticker),
        name: asset.name,
        assetType: asset.assetType,
        quantity: asset.quantity,
        averagePrice: asset.averagePrice,
        currentPrice: asset.currentPrice,
        currentValue: asset.currentValue,
        dividends: asset.dividends,
      })),
    }),
  });

  const data = await readFunctionResponse(response);
  if (!response.ok) throw new Error(friendlyFunctionError(data, response.status));
  if (!isInvestmentImageAnalysis(data)) throw new Error("A IA não retornou uma análise válida do print.");
  return data;
}

async function analyzeWithLocalOcr(files: File[], assets: InvestmentAsset[]): Promise<InvestmentImageAnalysis> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  try {
    const texts: string[] = [];
    for (const file of files) {
      const { data } = await worker.recognize(file);
      texts.push(data.text);
    }

    const ocrText = texts.join("\n");
    const updates = dedupeInvestmentUpdates([
      ...parseCdbCardsFromText(ocrText),
      ...parseFiiCardsFromText(ocrText, assets),
    ]);
    return {
      summary: updates.length ? `${updates.length} investimento(s) identificado(s) por OCR local.` : "Nenhum investimento identificado por OCR local.",
      updates,
      unmatched: [],
    };
  } finally {
    await worker.terminate();
  }
}

function parseCdbCardsFromText(text: string): InvestmentImageUpdate[] {
  const lines = textToLines(text);
  const updates: InvestmentImageUpdate[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const nameLine = cleanInvestmentName(lines[index]);
    if (!nameLine || !/\bcdb\b/i.test(nameLine)) continue;

    const windowLines = lines.slice(index, index + 8);
    const balanceLine = windowLines.find((line) => /saldo bruto/i.test(line));
    const yieldLine = windowLines.find((line) => /rendimento bruto/i.test(line));
    const currentValue = parseCurrencyFromText(balanceLine);
    const dividends = parseCurrencyFromText(yieldLine);
    if (!currentValue) continue;

    updates.push({
      ticker: "",
      name: nameLine,
      assetType: "cdb",
      quantity: 1,
      averagePrice: null,
      currentPrice: currentValue,
      currentValue,
      dividends,
      confidence: yieldLine ? 0.9 : 0.82,
      sourceText: windowLines.join(" | "),
    });
  }

  return dedupeInvestmentUpdates(updates);
}

function parseFiiCardsFromText(text: string, assets: InvestmentAsset[]): InvestmentImageUpdate[] {
  const lines = textToLines(text);
  const updates: InvestmentImageUpdate[] = [];
  const usedTickers = new Set<string>();
  for (let index = 0; index < lines.length; index += 1) {
    const headerValue = parseCurrencyFromText(lines[index]);
    const windowLines = lines.slice(index, index + 8);
    if (!headerValue || !findLineByLabels(windowLines, ["quantidade"]) || !findLineByLabels(windowLines, ["preço atual", "preco atual", "prego atual"])) continue;

    const rawName = cleanFiiHeaderName(lines[index]);
    const currentPrice = findCurrencyByLabels(windowLines, ["preço atual", "preco atual", "prego atual", "cota atual", "cotação", "cotacao"]);
    const currentValue = headerValue;
    const quantity = findNumberByLabels(windowLines, ["quantidade", "qtd", "cotas"]) ?? inferQuantity(currentValue, currentPrice);
    const profitLoss = findLastCurrencyByLabels(windowLines, ["rentabilidade"]);
    const averagePrice = inferAveragePrice(currentValue, quantity, profitLoss) ?? findCurrencyByLabels(windowLines, ["preço médio", "preco medio", "pm"]);
    const ticker = resolveFiiTicker(rawName, assets, { quantity, currentPrice, currentValue }, usedTickers);
    if (!ticker && !rawName) continue;
    if (ticker) usedTickers.add(ticker);

    updates.push({
      ticker,
      name: ticker ? null : rawName,
      assetType: "fii",
      quantity,
      averagePrice,
      currentPrice,
      currentValue,
      dividends: null,
      confidence: ticker ? 0.88 : 0.62,
      sourceText: windowLines.join(" | "),
    });
  }

  return dedupeInvestmentUpdates(updates);
}

function textToLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function findCurrencyByLabels(lines: string[], labels: string[]) {
  const line = findLineByLabels(lines, labels);
  return parseCurrencyFromText(line) ?? parseNumberAfterAnyLabel(line, labels);
}

function findLastCurrencyByLabels(lines: string[], labels: string[]) {
  const line = findLineByLabels(lines, labels);
  return parseCurrencyValuesFromText(line).at(-1) ?? null;
}

function findNumberByLabels(lines: string[], labels: string[]) {
  const line = findLineByLabels(lines, labels);
  return parseNumberAfterAnyLabel(line, labels);
}

function findLineByLabels(lines: string[], labels: string[]) {
  return lines.find((line) => labels.some((label) => normalizeText(line).includes(normalizeText(label))));
}

function cleanFiiHeaderName(line: string) {
  const beforeValue = line.split(/R\$\s*/i)[0] ?? "";
  return beforeValue
    .replace(/[$€]/g, "")
    .replace(/^[S5]\s+/i, "")
    .replace(/\b(renda|variavel|variável|acoes|ações|fiis|mais|contratos|futuros)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function inferQuantity(currentValue: number | null, currentPrice: number | null) {
  if (!currentValue || !currentPrice) return null;
  const quantity = currentValue / currentPrice;
  const rounded = Math.round(quantity);
  return Math.abs(quantity - rounded) < 0.04 ? rounded : null;
}

function inferAveragePrice(currentValue: number | null, quantity: number | null, profitLoss: number | null) {
  if (!currentValue || !quantity || !Number.isFinite(profitLoss)) return null;
  const investedValue = currentValue - Number(profitLoss);
  if (investedValue <= 0) return null;
  return investedValue / quantity;
}

function resolveFiiTicker(
  rawName: string,
  assets: InvestmentAsset[],
  metrics: { quantity: number | null; currentPrice: number | null; currentValue: number | null },
  usedTickers: Set<string>,
) {
  const visible = normalizeTickerLike(rawName);
  const fiiAssets = assets.filter((asset) => asset.assetType === "fii" && normalizeTicker(asset.ticker) && !usedTickers.has(normalizeTicker(asset.ticker)));
  const exact = fiiAssets.find((asset) => visible.includes(normalizeTicker(asset.ticker)));
  if (exact) return normalizeTicker(exact.ticker);

  const prefixMatch = fiiAssets
    .map((asset) => ({ asset, distance: levenshtein(visible.slice(0, 4), normalizeTicker(asset.ticker).slice(0, 4)) }))
    .filter((item) => visible.length >= 3 && item.distance <= 2)
    .sort((a, b) => a.distance - b.distance)[0]?.asset;
  if (prefixMatch) return normalizeTicker(prefixMatch.ticker);

  const metricMatch = fiiAssets
    .map((asset) => {
      let score = 0;
      if (metrics.quantity && Math.abs(asset.quantity - metrics.quantity) < 0.01) score += 2;
      if (metrics.currentPrice && closeEnough(asset.currentPrice, metrics.currentPrice, 0.08)) score += 2;
      if (metrics.currentValue && closeEnough(asset.currentValue, metrics.currentValue, 0.08)) score += 2;
      return { asset, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  return metricMatch && metricMatch.score >= 4 ? normalizeTicker(metricMatch.asset.ticker) : "";
}

function normalizeTickerLike(value: string) {
  return value
    .toUpperCase()
    .replace(/[|Il]/g, "1")
    .replace(/[^A-Z0-9]/g, "");
}

function closeEnough(left: number, right: number, tolerance: number) {
  if (!left || !right) return false;
  return Math.abs(left - right) / Math.max(Math.abs(left), Math.abs(right)) <= tolerance;
}

function levenshtein(left: string, right: string) {
  const dp = Array.from({ length: left.length + 1 }, () => Array(right.length + 1).fill(0) as number[]);
  for (let i = 0; i <= left.length; i += 1) dp[i][0] = i;
  for (let j = 0; j <= right.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= left.length; i += 1) {
    for (let j = 1; j <= right.length; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[left.length][right.length];
}

function parseNumberAfterAnyLabel(line: string | undefined, labels: string[]) {
  if (!line) return null;
  const normalizedLine = normalizeText(line);
  const label = labels.find((item) => normalizedLine.includes(normalizeText(item)));
  const searchable = label ? line.slice(Math.max(0, normalizedLine.indexOf(normalizeText(label)))) : line;
  const raw = searchable.match(/([0-9]{1,3}(?:\.[0-9]{3})*,[0-9]{1,4}|[0-9]+,[0-9]{1,4}|[0-9]{1,6})/)?.[1];
  if (!raw) return null;
  const value = Number(raw.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function cleanInvestmentName(line: string) {
  const cleaned = line
    .replace(/^[|Il1]\s*c[do]b\s*$/i, "")
    .replace(/\bcdbc6\b/gi, "CDB C6")
    .replace(/\s+\|+\s+ano\b/gi, " 1 ano")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned || /^cdb$/i.test(cleaned)) return "";
  return cleaned;
}

function parseCurrencyFromText(line?: string) {
  return parseCurrencyValuesFromText(line).at(0) ?? null;
}

function parseCurrencyValuesFromText(line?: string) {
  if (!line) return [];
  return [...line.matchAll(/R[$S]\s*(-?\s*[0-9.]+(?:,\d{2})?)/gi)]
    .map((match) => parseOcrMoney(match[1]))
    .filter((value): value is number => value !== null);
}

function parseOcrMoney(rawValue: string) {
  const raw = rawValue.replace(/\s+/g, "");
  const negative = raw.startsWith("-");
  const unsigned = raw.replace(/^-/, "");
  let normalized = "";
  if (unsigned.includes(",")) {
    normalized = unsigned.replace(/\./g, "").replace(",", ".");
  } else {
    const digits = unsigned.replace(/\D/g, "");
    if (!digits) return null;
    normalized = digits.length > 2 ? `${digits.slice(0, -2)}.${digits.slice(-2)}` : digits;
  }
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

function dedupeInvestmentUpdates(updates: InvestmentImageUpdate[]) {
  const seen = new Set<string>();
  return updates.filter((update) => {
    const key = `${normalizeTicker(update.ticker)}:${normalizeText(update.name || "")}:${update.currentValue}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

async function readFunctionResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: text };
  }
}

function friendlyFunctionError(payload: unknown, status: number) {
  const message = typeof payload === "object" && payload && "error" in payload ? String((payload as { error?: unknown }).error ?? "") : "";
  const normalized = message.toLowerCase();
  if (status === 429 || normalized.includes("quota") || normalized.includes("billing")) {
    return "A IA de leitura de prints está sem cota/saldo na chave da OpenAI configurada no Supabase. Atualize a cobrança ou troque a OPENAI_API_KEY em Functions > Secrets.";
  }
  if (status === 413 || normalized.includes("too large") || normalized.includes("payload")) {
    return "As imagens ficaram pesadas para análise. Envie menos prints por vez ou recorte a tela antes de importar.";
  }
  return message || "Não foi possível analisar o print agora.";
}

function isInvestmentImageAnalysis(value: unknown): value is InvestmentImageAnalysis {
  return Boolean(
    value &&
      typeof value === "object" &&
      "summary" in value &&
      "updates" in value &&
      "unmatched" in value &&
      Array.isArray((value as InvestmentImageAnalysis).updates) &&
      Array.isArray((value as InvestmentImageAnalysis).unmatched),
  );
}

async function fileToPayload(file: File): Promise<FilePayload> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Envie apenas imagens dos investimentos.");
  }

  const dataUrl = await resizeImageFile(file);
  return { name: file.name, mimeType: "image/jpeg", dataUrl };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

async function resizeImageFile(file: File) {
  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const maxSide = 1400;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return source;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.86);
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível preparar a imagem para análise."));
    image.src = source;
  });
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}
