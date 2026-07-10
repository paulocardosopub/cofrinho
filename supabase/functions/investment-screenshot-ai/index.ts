const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AssetType = "fii" | "stock" | "fixed_income" | "cdb" | "lci_lca" | "crypto" | "fund" | "treasury" | "other";

interface ScreenshotFile {
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface Holding {
  ticker: string;
  name: string;
  assetType: AssetType;
  category?: string;
  trackingMode?: "category_summary" | "maturity_detail";
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  dividends: number;
}

interface InvestmentAnalysis {
  summary: string;
  unmatched: string[];
  updates: Array<{
    scope: "category_summary";
    category: string;
    ticker: string;
    name: string | null;
    assetType: AssetType | null;
    quantity: number | null;
    averagePrice: number | null;
    currentPrice: number | null;
    currentValue: number | null;
    investedValue: number | null;
    dividends: number | null;
    confidence: number;
    sourceText: string;
  }>;
}

class ProviderError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return jsonResponse({}, 200);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json().catch(() => ({}));
    const files = Array.isArray(body.files) ? (body.files as ScreenshotFile[]).slice(0, 4) : [];
    const holdings = Array.isArray(body.holdings) ? (body.holdings as Holding[]) : [];
    if (!files.length) return jsonResponse({ error: "Envie ao menos uma imagem." }, 400);

    const provider = (Deno.env.get("AI_PROVIDER") ?? "openai").toLowerCase();
    const openAiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (provider === "gemini") {
      if (!geminiKey) return jsonResponse({ error: "GEMINI_API_KEY não configurada no Supabase." }, 500);
      return jsonResponse(await analyzeWithGemini(files, holdings, geminiKey), 200);
    }

    if (openAiKey) {
      try {
        return jsonResponse(await analyzeWithOpenAI(files, holdings, openAiKey), 200);
      } catch (error) {
        if (isQuotaError(error) && geminiKey) {
          return jsonResponse(await analyzeWithGemini(files, holdings, geminiKey), 200);
        }
        throw error;
      }
    }

    if (geminiKey) return jsonResponse(await analyzeWithGemini(files, holdings, geminiKey), 200);

    return jsonResponse({ error: "Configure OPENAI_API_KEY ou GEMINI_API_KEY no Supabase." }, 500);
  } catch (error) {
    console.error(error);
    if (error instanceof ProviderError) return jsonResponse({ error: error.message }, error.status);
    return jsonResponse({ error: "Não foi possível analisar o print agora." }, 500);
  }
});

async function analyzeWithOpenAI(files: ScreenshotFile[], holdings: Holding[], apiKey: string) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") ?? "gpt-4.1-mini",
      input: [
        {
          role: "developer",
          content: systemPrompt(),
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userPrompt(holdings),
            },
            ...files.map((file) => ({
              type: "input_image",
              image_url: file.dataUrl,
              detail: Deno.env.get("OPENAI_IMAGE_DETAIL") ?? "auto",
            })),
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "investment_screenshot_analysis",
          strict: true,
          schema: openAiSchema(),
        },
      },
    }),
  });

  const payload = await readJson(response);
  if (!response.ok) throw new ProviderError(friendlyProviderError(payload, response.status, "OpenAI"), response.status);
  const outputText = (payload as { output_text?: string }).output_text ?? extractOpenAiOutputText(payload);
  return parseAnalysis(outputText);
}

async function analyzeWithGemini(files: ScreenshotFile[], holdings: Holding[], apiKey: string) {
  const model = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: `${systemPrompt()}\n\n${userPrompt(holdings)}` },
            ...files.map((file) => ({
              inline_data: {
                mime_type: file.mimeType || "image/jpeg",
                data: dataUrlToBase64(file.dataUrl),
              },
            })),
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    }),
  });

  const payload = await readJson(response);
  if (!response.ok) throw new ProviderError(friendlyProviderError(payload, response.status, "Gemini"), response.status);
  const outputText = extractGeminiOutputText(payload);
  return parseAnalysis(outputText);
}

function systemPrompt() {
  return [
    "Você extrai dados de investimentos de prints de bancos e corretoras brasileiras.",
    "Não invente valores. Use números em BRL como number com ponto decimal.",
    "Os prints enviados mostram valores já consolidados por categoria, não por aplicação individual.",
    "Retorne exatamente uma atualização para cada categoria visível, como Limite Garantido, Renda Fixa, CDB, FIIs, Fundos, Ações, Tesouro ou Cripto.",
    "Use currentValue como o total atual da categoria e investedValue como o total aplicado quando estiver visível.",
    "Não separe CDBs, títulos, fundos ou outras aplicações individuais dentro de uma categoria.",
    "Quando a confiança for baixa, mantenha campos ausentes como null.",
  ].join(" ");
}

function userPrompt(holdings: Holding[]) {
  return `Ativos já cadastrados no app:
${JSON.stringify(holdings)}

Extraia os totais consolidados por categoria visíveis nos prints. Use as categorias já cadastradas como referência de nome, mas aceite novas categorias claramente visíveis.
Nunca retorne aplicações individuais: some-as dentro da categoria somente quando o print não exibir o total pronto.
Retorne somente JSON neste formato:
{
  "summary": "resumo curto",
  "unmatched": ["ativos vistos sem par no cadastro"],
  "updates": [
    {
      "scope": "category_summary",
      "category": "Limite Garantido",
      "ticker": "",
      "name": "Limite Garantido",
      "assetType": "fixed_income",
      "quantity": 1,
      "averagePrice": null,
      "currentPrice": 0,
      "currentValue": 0,
      "investedValue": null,
      "dividends": null,
      "confidence": 0.9,
      "sourceText": "trecho visível do print"
    }
  ]
}`;
}

function openAiSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["summary", "updates", "unmatched"],
    properties: {
      summary: { type: "string" },
      unmatched: { type: "array", items: { type: "string" } },
      updates: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: [
            "scope",
            "category",
            "ticker",
            "name",
            "assetType",
            "quantity",
            "averagePrice",
            "currentPrice",
            "currentValue",
            "investedValue",
            "dividends",
            "confidence",
            "sourceText",
          ],
          properties: {
            scope: { type: "string", enum: ["category_summary"] },
            category: { type: "string" },
            ticker: { type: "string" },
            name: { type: ["string", "null"] },
            assetType: { type: ["string", "null"], enum: ["fii", "stock", "fixed_income", "cdb", "lci_lca", "crypto", "fund", "treasury", "other", null] },
            quantity: { type: ["number", "null"] },
            averagePrice: { type: ["number", "null"] },
            currentPrice: { type: ["number", "null"] },
            currentValue: { type: ["number", "null"] },
            investedValue: { type: ["number", "null"] },
            dividends: { type: ["number", "null"] },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            sourceText: { type: "string" },
          },
        },
      },
    },
  };
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text } };
  }
}

function parseAnalysis(outputText: string) {
  const clean = outputText.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(clean) as InvestmentAnalysis;
  return {
    summary: String(parsed.summary || "Análise concluída."),
    unmatched: Array.isArray(parsed.unmatched) ? parsed.unmatched.map(String) : [],
    updates: Array.isArray(parsed.updates)
      ? parsed.updates.map((update) => ({
        scope: "category_summary" as const,
        category: String(update.category ?? update.name ?? "Sem categoria"),
        ticker: String(update.ticker ?? ""),
        name: update.name ? String(update.name) : null,
        assetType: normalizeAssetType(update.assetType),
        quantity: numberOrNull(update.quantity),
        averagePrice: numberOrNull(update.averagePrice),
        currentPrice: numberOrNull(update.currentPrice),
        currentValue: numberOrNull(update.currentValue),
        investedValue: numberOrNull(update.investedValue),
        dividends: numberOrNull(update.dividends),
        confidence: clamp(Number(update.confidence ?? 0), 0, 1),
        sourceText: String(update.sourceText ?? ""),
      }))
      : [],
  };
}

function extractOpenAiOutputText(payload: unknown) {
  const output = (payload as { output?: Array<{ content?: Array<{ text?: string }> }> }).output ?? [];
  return output.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("").trim();
}

function extractGeminiOutputText(payload: unknown) {
  const candidates = (payload as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates ?? [];
  return candidates.flatMap((candidate) => candidate.content?.parts ?? []).map((part) => part.text ?? "").join("").trim();
}

function friendlyProviderError(payload: unknown, status: number, provider: string) {
  const message =
    (payload as { error?: { message?: string } })?.error?.message ??
    (payload as { error?: string })?.error ??
    `Falha ao analisar o print com ${provider}.`;
  const normalized = String(message).toLowerCase();
  if (status === 429 || normalized.includes("quota") || normalized.includes("billing")) {
    return `${provider} está sem cota/saldo para analisar prints agora.`;
  }
  if (status === 401 || status === 403 || normalized.includes("api key")) {
    return `A chave do ${provider} não foi aceita.`;
  }
  return String(message);
}

function isQuotaError(error: unknown) {
  return error instanceof ProviderError && (error.status === 429 || error.message.toLowerCase().includes("cota") || error.message.toLowerCase().includes("quota"));
}

function dataUrlToBase64(dataUrl: string) {
  return dataUrl.includes(",") ? dataUrl.split(",").at(-1) ?? "" : dataUrl;
}

function normalizeAssetType(value: unknown): AssetType | null {
  const allowed: AssetType[] = ["fii", "stock", "fixed_income", "cdb", "lci_lca", "crypto", "fund", "treasury", "other"];
  return allowed.includes(value as AssetType) ? (value as AssetType) : null;
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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
