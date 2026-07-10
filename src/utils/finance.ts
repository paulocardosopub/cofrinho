import type { Category, DividendIncome, Goal, InvestmentAsset, Transaction, UserData } from "../types";
import { toMonth } from "./format";

export function signedAmount(transaction: Transaction) {
  if (transaction.type === "income" || transaction.type === "credit") return transaction.amount;
  if (transaction.type === "transfer") return 0;
  return -transaction.amount;
}

export function getMonthTransactions(transactions: Transaction[], month: string) {
  return transactions.filter((transaction) => transaction.date.startsWith(month));
}

export function sumTransactions(transactions: Transaction[], predicate?: (transaction: Transaction) => boolean) {
  return transactions.filter(predicate ?? (() => true)).reduce((total, transaction) => total + transaction.amount, 0);
}

export function calculateDashboard(data: UserData, month = new Date().toISOString().slice(0, 7)) {
  const monthTransactions = getMonthTransactions(data.transactions, month);
  const income = sumTransactions(monthTransactions, (item) => item.type === "income" || item.type === "credit");
  const expenses = sumTransactions(monthTransactions, (item) => item.type === "expense");
  const investmentsOutflow = sumTransactions(monthTransactions, (item) => item.type === "investment");
  const balance = data.transactions.reduce((total, transaction) => total + signedAmount(transaction), 0);
  const invested = data.investments.reduce((total, asset) => total + asset.investedValue, 0);
  const current = data.investments.reduce((total, asset) => total + asset.currentValue, 0);
  const dividends = data.dividends.reduce((total, dividend) => total + dividend.amount, 0);
  const result = income - expenses - investmentsOutflow;
  const investmentReturn = current - invested + dividends;

  return {
    income,
    expenses,
    investmentsOutflow,
    result,
    balance,
    invested,
    current,
    dividends,
    investmentReturn,
    investmentReturnRate: invested > 0 ? investmentReturn / invested : 0,
  };
}

export function getCategoryMap(categories: Category[]) {
  return new Map(categories.map((category) => [category.id, category]));
}

export function groupExpensesByCategory(transactions: Transaction[], categories: Category[], month?: string) {
  const categoryMap = getCategoryMap(categories);
  const filtered = month ? getMonthTransactions(transactions, month) : transactions;
  const totals = new Map<string, number>();

  filtered
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      totals.set(transaction.categoryId, (totals.get(transaction.categoryId) ?? 0) + transaction.amount);
    });

  return [...totals.entries()]
    .map(([categoryId, total]) => ({
      id: categoryId,
      name: categoryMap.get(categoryId)?.name ?? "Sem categoria",
      color: categoryMap.get(categoryId)?.color ?? "#64748b",
      value: total,
      budget: categoryMap.get(categoryId)?.monthlyBudget ?? 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function getMonthlyCashflow(transactions: Transaction[], monthsBack = 6) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - index), 1);
    const key = date.toISOString().slice(0, 7);
    return {
      month: key,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date),
      receitas: 0,
      despesas: 0,
      investimentos: 0,
      saldo: 0,
    };
  });

  transactions.forEach((transaction) => {
    const row = months.find((item) => item.month === toMonth(transaction.date));
    if (!row) return;
    if (transaction.type === "income" || transaction.type === "credit") row.receitas += transaction.amount;
    if (transaction.type === "expense") row.despesas += transaction.amount;
    if (transaction.type === "investment") row.investimentos += transaction.amount;
    row.saldo += signedAmount(transaction);
  });

  let accumulated = 0;
  return months.map((row) => {
    accumulated += row.saldo;
    return { ...row, acumulado: accumulated };
  });
}

export function getInvestmentAllocation(investments: InvestmentAsset[], field: "assetType" | "ticker" | "category" = "assetType") {
  const totals = new Map<string, number>();
  investments.forEach((asset) => {
    const label = field === "assetType" ? assetTypeLabel(asset.assetType) : asset[field] || "Sem categoria";
    totals.set(label, (totals.get(label) ?? 0) + asset.currentValue);
  });

  return [...totals.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function getPortfolioEvolution(investments: InvestmentAsset[], dividends: DividendIncome[]) {
  const invested = investments.reduce((total, asset) => total + asset.investedValue, 0);
  const current = investments.reduce((total, asset) => total + asset.currentValue, 0);
  const income = dividends.reduce((total, dividend) => total + dividend.amount, 0);

  return [
    { label: "Investido", value: invested },
    { label: "Atual", value: current },
    { label: "Atual + proventos", value: current + income },
  ];
}

export function getInvestmentEvolution(investments: InvestmentAsset[], dividends: DividendIncome[], monthsBack = 6) {
  const now = new Date();
  const months = Array.from({ length: monthsBack }).map((_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - index), 1);
    const month = date.toISOString().slice(0, 7);
    return {
      month,
      label: new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit" }).format(date),
      investido: 0,
      atual: 0,
      proventos: 0,
    };
  });

  return months.map((row) => {
    const activeAssets = investments.filter((asset) => toMonth(asset.buyDate || asset.createdAt) <= row.month);
    const monthDividends = dividends.filter((dividend) => toMonth(dividend.date) <= row.month);
    return {
      ...row,
      investido: activeAssets.reduce((total, asset) => total + asset.investedValue, 0),
      atual: activeAssets.reduce((total, asset) => total + asset.currentValue, 0),
      proventos: monthDividends.reduce((total, dividend) => total + dividend.amount, 0),
    };
  });
}

export function getDividendsByMonth(dividends: DividendIncome[]) {
  const totals = new Map<string, number>();
  dividends.forEach((dividend) => {
    const month = toMonth(dividend.date);
    totals.set(month, (totals.get(month) ?? 0) + dividend.amount);
  });

  return [...totals.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, value]) => ({ month, value }));
}

export function calculateGoalProgress(goal: Goal) {
  if (goal.targetAmount <= 0) return 0;
  return Math.min(goal.currentAmount / goal.targetAmount, 1);
}

export function getTopCategory(transactions: Transaction[], categories: Category[]) {
  return groupExpensesByCategory(transactions, categories)[0];
}

export function assetTypeLabel(type: InvestmentAsset["assetType"]) {
  const labels: Record<InvestmentAsset["assetType"], string> = {
    fii: "Fundo Imobiliário (FII)",
    stock: "Ações",
    fixed_income: "Renda Fixa",
    cdb: "CDB",
    lci_lca: "LCI / LCA",
    crypto: "Criptomoedas",
    fund: "Fundo de Investimento",
    treasury: "Tesouro Direto",
    other: "Outro",
  };
  return labels[type];
}

export function recalculateAsset(asset: InvestmentAsset): InvestmentAsset {
  const investedValue = asset.investedValue || asset.quantity * asset.averagePrice;
  const currentValue = asset.currentValue || asset.quantity * asset.currentPrice;
  return {
    ...asset,
    investedValue,
    currentValue,
  };
}
