import Papa from "papaparse";
import { DEFAULT_ACCOUNT_ID, UNCATEGORIZED_ID } from "../data/defaults";
import type { Category, ImportPreviewItem, Transaction, TransactionType, UserData } from "../types";
import { parseMoney } from "../utils/format";
import { makeId } from "./storage";

type CsvRow = Record<string, unknown>;

const dateKeys = ["data", "date", "dt", "lançamento", "lancamento"];
const amountKeys = ["valor", "amount", "preço", "preco", "total"];
const descriptionKeys = ["descrição", "descricao", "description", "histórico", "historico", "nome", "memo"];
const typeKeys = ["tipo", "type", "natureza"];
const categoryKeys = ["categoria", "category", "grupo"];
const accountKeys = ["conta", "account", "carteira"];

function pickValue(row: CsvRow, aliases: string[]) {
  const entries = Object.entries(row);
  const match = entries.find(([key]) => aliases.some((alias) => key.toLowerCase().includes(alias)));
  return match?.[1]?.toString().trim() ?? "";
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function parseDate(value: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const br = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (br) {
    const day = br[1].padStart(2, "0");
    const month = br[2].padStart(2, "0");
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString().slice(0, 10) : parsed.toISOString().slice(0, 10);
}

function inferType(typeText: string, amount: number): TransactionType {
  const normalized = normalizeText(typeText);
  if (normalized.includes("invest")) return "investment";
  if (normalized.includes("transfer")) return "transfer";
  if (normalized.includes("credito") || normalized.includes("receita") || normalized.includes("entrada")) return "income";
  if (normalized.includes("debito") || normalized.includes("despesa") || normalized.includes("saida")) return "expense";
  return amount < 0 ? "expense" : "income";
}

function inferCategoryId(categories: Category[], categoryText: string, description: string, type: TransactionType) {
  const search = normalizeText(`${categoryText} ${description}`);
  const direct = categories.find((category) => search.includes(normalizeText(category.name)));
  if (direct) return direct.id;

  const rules: Array<[RegExp, string]> = [
    [/mercado|supermercado|ifood|delivery|restaurante|padaria/, "cat-alimentacao"],
    [/aluguel|condominio|luz|energia|agua|internet/, "cat-moradia"],
    [/uber|99|combustivel|posto|estacionamento/, "cat-transporte"],
    [/netflix|spotify|icloud|hbo|youtube|canva|chatgpt|assinatura/, "cat-assinaturas"],
    [/salario|pagamento|freelance|cliente/, "cat-salario"],
    [/dividendo|provento|rendimento/, "cat-dividendos"],
    [/cdb|fii|tesouro|acao|ações|bitcoin|btc|cripto|corretora/, "cat-investimentos"],
  ];

  const found = rules.find(([rule]) => rule.test(search));
  if (found && categories.some((category) => category.id === found[1])) return found[1];
  if (type === "investment" && categories.some((category) => category.id === "cat-investimentos")) return "cat-investimentos";
  return UNCATEGORIZED_ID;
}

function isDuplicate(existing: Transaction[], item: Pick<ImportPreviewItem, "date" | "amount" | "description" | "type">) {
  const normalizedDescription = normalizeText(item.description);
  return existing.some((transaction) => {
    const sameDate = transaction.date === item.date;
    const sameAmount = Math.abs(transaction.amount - item.amount) < 0.01;
    const sameDescription = normalizeText(transaction.description) === normalizedDescription;
    return sameDate && sameAmount && sameDescription && transaction.type === item.type;
  });
}

function rowToPreview(row: CsvRow, data: UserData): ImportPreviewItem | null {
  const rawAmount = pickValue(row, amountKeys);
  const amount = parseMoney(rawAmount);
  if (!amount) return null;

  const description = pickValue(row, descriptionKeys) || "Transação importada";
  const type = inferType(pickValue(row, typeKeys), amount);
  const date = parseDate(pickValue(row, dateKeys));
  const categoryId = inferCategoryId(data.categories, pickValue(row, categoryKeys), description, type);
  const accountName = normalizeText(pickValue(row, accountKeys));
  const accountId = data.accounts.find((account) => normalizeText(account.name).includes(accountName))?.id ?? DEFAULT_ACCOUNT_ID;

  const item: ImportPreviewItem = {
    id: makeId("preview"),
    selected: true,
    duplicate: false,
    type,
    amount: Math.abs(amount),
    date,
    description,
    categoryId,
    accountId,
    paymentMethod: "Importado",
    notes: "Importado por CSV.",
    source: "csv",
  };

  return { ...item, duplicate: isDuplicate(data.transactions, item), selected: !isDuplicate(data.transactions, item) };
}

export async function parseCsvFile(file: File, data: UserData) {
  return new Promise<ImportPreviewItem[]>((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const items = result.data.map((row) => rowToPreview(row, data)).filter(Boolean) as ImportPreviewItem[];
        resolve(items);
      },
      error: (error) => reject(error),
    });
  });
}

export async function analyzeImageFiles(files: File[], data: UserData) {
  const today = new Date().toISOString().slice(0, 10);
  const suggestions = files.flatMap((file, index) => {
    const lowerName = normalizeText(file.name);
    const isBroker = /corretora|fii|invest|cdb|renda|bitcoin|btc/.test(lowerName);
    const baseDescription = isBroker ? "Atualização identificada no print da corretora" : "Transação identificada no print do banco";
    const type: TransactionType = isBroker ? "investment" : index % 2 === 0 ? "expense" : "income";
    const amount = isBroker ? 1000 + index * 250 : index % 2 === 0 ? 89.9 + index * 20 : 420 + index * 110;
    const categoryId = inferCategoryId(data.categories, "", file.name, type);
    const item: ImportPreviewItem = {
      id: makeId("preview"),
      selected: true,
      duplicate: false,
      type,
      amount,
      date: today,
      description: `${baseDescription}: ${file.name}`,
      categoryId,
      accountId: isBroker ? "acc-corretora" : DEFAULT_ACCOUNT_ID,
      paymentMethod: "Imagem",
      notes:
        "Prévia mockada. Em produção, esta etapa deve chamar um endpoint seguro de OCR/IA no Supabase Edge Function ou backend.",
      source: "image",
    };
    return [{ ...item, duplicate: isDuplicate(data.transactions, item), selected: !isDuplicate(data.transactions, item) }];
  });

  return suggestions;
}
