import type { ChatMessage, UserData } from "../types";
import { calculateDashboard, getTopCategory } from "../utils/finance";
import { formatCurrency, formatPercent } from "../utils/format";
import { makeId } from "./storage";

const aiEndpoint = import.meta.env.VITE_AI_ENDPOINT as string | undefined;

export const aiService = {
  async generateInsight(data: UserData) {
    if (aiEndpoint) {
      const response = await fetch(`${aiEndpoint}/insight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      if (response.ok) return response.json();
    }

    const summary = calculateDashboard(data);
    const topCategory = getTopCategory(data.transactions, data.categories);
    const messages = [];

    if (topCategory) {
      messages.push({
        id: makeId("insight"),
        title: `Maior gasto: ${topCategory.name}`,
        message: `Essa categoria concentra ${formatCurrency(topCategory.value)} em despesas. Revise compras recorrentes e defina um limite mensal se ainda não houver orçamento.`,
        severity: topCategory.budget && topCategory.value > topCategory.budget ? "warning" : "info",
        createdAt: new Date().toISOString(),
      });
    }

    messages.push({
      id: makeId("insight"),
      title: "Patrimônio investido",
      message: `Sua carteira está em ${formatCurrency(summary.current)} com rentabilidade acumulada de ${formatPercent(summary.investmentReturnRate)} considerando proventos cadastrados.`,
      severity: summary.investmentReturn >= 0 ? "success" : "warning",
      createdAt: new Date().toISOString(),
    });

    if (!data.transactions.length) {
      messages.push({
        id: makeId("insight"),
        title: "Ainda faltam dados",
        message: "Importe um CSV ou print do banco para o Guru conseguir detectar padrões de gastos com mais segurança.",
        severity: "info",
        createdAt: new Date().toISOString(),
      });
    }

    return messages;
  },

  async chat(question: string, data: UserData): Promise<ChatMessage> {
    if (aiEndpoint) {
      const response = await fetch(`${aiEndpoint}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, data }),
      });
      if (response.ok) {
        const payload = (await response.json()) as { content?: string };
        return {
          id: makeId("chat"),
          role: "assistant",
          content: payload.content ?? "Não consegui interpretar a resposta do serviço de IA.",
          createdAt: new Date().toISOString(),
        };
      }
    }

    const normalized = question.toLowerCase();
    const summary = calculateDashboard(data);
    const topCategory = getTopCategory(data.transactions, data.categories);
    let content = "";

    if (!data.transactions.length && !data.investments.length) {
      content =
        "Ainda não há dados suficientes para uma análise confiável. Importe transações ou cadastre investimentos primeiro.";
    } else if (normalized.includes("gasto") || normalized.includes("gastando")) {
      content = topCategory
        ? `O maior ponto de atenção hoje é ${topCategory.name}, com ${formatCurrency(topCategory.value)} em gastos. Eu olharia primeiro para recorrências, assinaturas e compras pequenas repetidas.`
        : "Não encontrei despesas suficientes para dizer onde você está gastando mais.";
    } else if (normalized.includes("invest") || normalized.includes("fii")) {
      content = `Sua carteira cadastrada está em ${formatCurrency(summary.current)}. O resultado acumulado, incluindo proventos registrados, é ${formatCurrency(summary.investmentReturn)} (${formatPercent(summary.investmentReturnRate)}). Para melhorar a leitura, mantenha preço atual e proventos dos FIIs atualizados.`;
    } else if (normalized.includes("mês") || normalized.includes("mes") || normalized.includes("resuma")) {
      content = `Resumo do mês: receitas de ${formatCurrency(summary.income)}, despesas de ${formatCurrency(summary.expenses)} e aportes de ${formatCurrency(summary.investmentsOutflow)}. O resultado operacional ficou em ${formatCurrency(summary.result)}.`;
    } else if (normalized.includes("meta")) {
      content = data.goals.length
        ? `Você tem ${data.goals.length} meta(s). A melhor próxima ação é atualizar o valor atual de cada uma e vincular aportes recorrentes para acompanhar progresso real.`
        : "Você ainda não cadastrou metas. Comece por reserva de emergência, aporte mensal em FIIs ou quitação de dívida.";
    } else {
      content =
        "Eu consigo te ajudar com gastos, metas, importação de extratos, investimentos e FIIs. Minha leitura é educacional e baseada apenas nos dados cadastrados no app.";
    }

    return {
      id: makeId("chat"),
      role: "assistant",
      content,
      createdAt: new Date().toISOString(),
    };
  },
};
