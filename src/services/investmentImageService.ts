import type { AssetType, InvestmentAsset } from "../types";
import { isSupabaseConfigured, supabase } from "./supabaseClient";

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
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("IA de leitura de prints ainda não está conectada ao Supabase neste ambiente.");
  }

  const payloadFiles = await Promise.all(files.map(fileToPayload));
  const { data, error } = await supabase.functions.invoke<InvestmentImageAnalysis>("investment-screenshot-ai", {
    body: {
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
    },
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("A IA não retornou uma análise do print.");
  return data;
}

function fileToPayload(file: File) {
  return new Promise<FilePayload>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, mimeType: file.type || "image/png", dataUrl: String(reader.result) });
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}
