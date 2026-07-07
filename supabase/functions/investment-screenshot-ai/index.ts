const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AssetType = "fii" | "stock" | "fixed_income" | "cdb" | "crypto" | "fund" | "treasury" | "other";

interface ScreenshotFile {
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface Holding {
  ticker: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  dividends: number;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return jsonResponse({}, 200);
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return jsonResponse({ error: "OPENAI_API_KEY não configurada no Supabase." }, 500);

  try {
    const body = await request.json().catch(() => ({}));
    const files = Array.isArray(body.files) ? (body.files as ScreenshotFile[]).slice(0, 4) : [];
    const holdings = Array.isArray(body.holdings) ? (body.holdings as Holding[]) : [];
    if (!files.length) return jsonResponse({ error: "Envie ao menos uma imagem." }, 400);

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
            content:
              "Você extrai dados de investimentos de prints de bancos e corretoras brasileiras. Não invente valores. Use números em BRL como number com ponto decimal. Quando só existir valor total e quantidade, calcule a cota atual. Quando a confiança for baixa, mantenha campos ausentes como null.",
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Ativos já cadastrados no app:\n${JSON.stringify(holdings)}\n\nExtraia holdings e atualizações visíveis nos prints. Foque em FIIs, CDBs, fundos, ações, tesouro e crypto. Retorne somente JSON no schema solicitado.`,
              },
              ...files.map((file) => ({
                type: "input_image",
                image_url: file.dataUrl,
                detail: "high",
              })),
            ],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "investment_screenshot_analysis",
            strict: true,
            schema: {
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
                      "ticker",
                      "name",
                      "assetType",
                      "quantity",
                      "averagePrice",
                      "currentPrice",
                      "currentValue",
                      "dividends",
                      "confidence",
                      "sourceText",
                    ],
                    properties: {
                      ticker: { type: "string" },
                      name: { type: ["string", "null"] },
                      assetType: { type: ["string", "null"], enum: ["fii", "stock", "fixed_income", "cdb", "crypto", "fund", "treasury", "other", null] },
                      quantity: { type: ["number", "null"] },
                      averagePrice: { type: ["number", "null"] },
                      currentPrice: { type: ["number", "null"] },
                      currentValue: { type: ["number", "null"] },
                      dividends: { type: ["number", "null"] },
                      confidence: { type: "number", minimum: 0, maximum: 1 },
                      sourceText: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    });

    const payload = await response.json();
    if (!response.ok) return jsonResponse({ error: payload.error?.message ?? "Falha ao analisar o print." }, response.status);

    const outputText = payload.output_text ?? extractOutputText(payload);
    const parsed = JSON.parse(outputText);
    return jsonResponse(parsed, 200);
  } catch {
    return jsonResponse({ error: "Não foi possível analisar o print agora." }, 500);
  }
});

function extractOutputText(payload: unknown) {
  const output = (payload as { output?: Array<{ content?: Array<{ text?: string; type?: string }> }> }).output ?? [];
  return output.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("").trim();
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
