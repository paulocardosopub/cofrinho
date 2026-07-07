const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface QuotePoint {
  label: string;
  price: number;
}

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return jsonResponse({}, 200);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const tickers = Array.isArray(body.tickers) ? body.tickers.map(normalizeTicker).filter(Boolean).slice(0, 24) : [];
    if (!tickers.length) return jsonResponse({ quotes: [] }, 200);

    const settled = await Promise.allSettled(tickers.map(fetchYahooQuote));
    const quotes = settled.flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []));
    return jsonResponse({ quotes }, 200);
  } catch {
    return jsonResponse({ error: "Não foi possível buscar as cotações agora." }, 500);
  }
});

async function fetchYahooQuote(ticker: string) {
  const symbol = `${ticker}.SA`;
  const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`, {
    headers: { accept: "application/json" },
  });
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
    source: "Yahoo Finance",
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeTicker(ticker: unknown) {
  if (typeof ticker !== "string") return "";
  return ticker.trim().toUpperCase().replace(/\.SA$/, "").replace(/[^A-Z0-9]/g, "");
}

function jsonResponse(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
