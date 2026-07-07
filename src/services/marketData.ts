import type { InvestmentAsset } from "../types";

export interface QuotePoint {
  label: string;
  price: number;
}

export interface FundQuote {
  ticker: string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  points: QuotePoint[];
  source: string;
  fetchedAt: string;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        symbol?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
    error?: unknown;
  };
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const inferredSupabaseEndpoint = supabaseUrl ? `${supabaseUrl}/functions/v1/fund-quotes` : "";
const configuredEndpoint = import.meta.env.VITE_QUOTES_ENDPOINT || import.meta.env.VITE_MARKET_DATA_ENDPOINT || inferredSupabaseEndpoint;

export async function fetchFundQuotes(assets: InvestmentAsset[]): Promise<FundQuote[]> {
  const tickers = uniqueTickers(assets);
  if (!tickers.length) return [];

  const configured = await fetchConfiguredQuotes(tickers);
  if (configured.length) return configured;

  const settled = await Promise.allSettled(tickers.map(fetchYahooQuote));
  const quotes = settled.flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));
  if (!quotes.length) throw new Error("quotes-unavailable");
  return quotes;
}

function uniqueTickers(assets: InvestmentAsset[]) {
  return [...new Set(assets.map((asset) => normalizeTicker(asset.ticker)).filter(Boolean))];
}

async function fetchConfiguredQuotes(tickers: string[]) {
  if (!configuredEndpoint) return [];

  try {
    const response = await fetch(configuredEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(supabaseAnonKey ? { apikey: supabaseAnonKey, Authorization: `Bearer ${supabaseAnonKey}` } : {}),
      },
      body: JSON.stringify({ tickers }),
    });
    if (!response.ok) return [];

    const payload = await response.json();
    const rows = Array.isArray(payload) ? payload : payload.quotes;
    if (!Array.isArray(rows)) return [];

    return rows.map(normalizeExternalQuote).filter(Boolean) as FundQuote[];
  } catch {
    return [];
  }
}

async function fetchYahooQuote(ticker: string): Promise<FundQuote | null> {
  const symbol = ticker.endsWith(".SA") ? ticker : `${ticker}.SA`;
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`);
  if (!response.ok) return null;

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];
  const closes = result?.indicators?.quote?.[0]?.close ?? [];
  const timestamps = result?.timestamp ?? [];
  const points = closes
    .map((price, index) => {
      if (!price) return null;
      const date = timestamps[index] ? new Date(timestamps[index] * 1000) : new Date();
      return {
        label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(date),
        price,
      };
    })
    .filter(Boolean) as QuotePoint[];

  const price = Number(result?.meta?.regularMarketPrice ?? points.at(-1)?.price ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;

  const previousClose = Number(result?.meta?.previousClose ?? points.at(-2)?.price ?? 0);
  return {
    ticker,
    price,
    previousClose: previousClose > 0 ? previousClose : undefined,
    changePercent: previousClose > 0 ? (price - previousClose) / previousClose : undefined,
    points: points.slice(-12),
    source: configuredEndpoint ? "API" : "Yahoo Finance",
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeExternalQuote(row: unknown) {
  if (!row || typeof row !== "object") return null;
  const quote = row as Partial<FundQuote> & { symbol?: string; currentPrice?: number };
  const ticker = normalizeTicker(String(quote.ticker ?? quote.symbol ?? ""));
  const price = Number(quote.price ?? quote.currentPrice);
  if (!ticker || !Number.isFinite(price) || price <= 0) return null;

  const previousClose = Number(quote.previousClose);
  return {
    ticker,
    price,
    previousClose: previousClose > 0 ? previousClose : undefined,
    changePercent: Number.isFinite(quote.changePercent) ? quote.changePercent : previousClose > 0 ? (price - previousClose) / previousClose : undefined,
    points: Array.isArray(quote.points) ? quote.points : [],
    source: quote.source ?? "API",
    fetchedAt: quote.fetchedAt ?? new Date().toISOString(),
  };
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}
