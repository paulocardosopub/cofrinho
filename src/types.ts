export type TransactionType = "income" | "expense" | "credit" | "investment" | "transfer";
export type TransactionStatus = "paid" | "pending" | "planned";
export type TransactionSource = "manual" | "csv" | "image" | "ai";
export type CategoryType = "income" | "expense" | "investment" | "credit" | "both";
export type AssetType = "fii" | "stock" | "fixed_income" | "cdb" | "crypto" | "fund" | "treasury" | "other";
export type GoalStatus = "active" | "paused" | "completed";
export type AppTheme = "light" | "dark";

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "broker" | "wallet" | "credit";
  balance: number;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  monthlyBudget?: number;
  archived?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  accountId: string;
  paymentMethod: string;
  status: TransactionStatus;
  notes?: string;
  tags: string[];
  recurring?: boolean;
  installment?: {
    current: number;
    total: number;
  };
  source: TransactionSource;
  importBatchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentAsset {
  id: string;
  assetType: AssetType;
  ticker: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  dividends: number;
  dividendYield?: number;
  buyDate: string;
  maturityDate?: string;
  broker?: string;
  category?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentOperation {
  id: string;
  assetId: string;
  type: "buy" | "sell" | "income";
  date: string;
  quantity: number;
  unitPrice: number;
  fees: number;
  notes?: string;
}

export interface DividendIncome {
  id: string;
  assetId: string;
  date: string;
  amount: number;
  description: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string;
  categoryId?: string;
  status: GoalStatus;
  createdAt: string;
}

export interface ImportBatch {
  id: string;
  source: "csv" | "image" | "json";
  fileName: string;
  createdAt: string;
  status: "previewed" | "imported" | "failed";
  itemsTotal: number;
  importedTotal: number;
}

export interface AIInsight {
  id: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "success";
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface UserSettings {
  currency: "BRL";
  theme: AppTheme;
  visualVersion?: number;
  dashboardPeriod: "month" | "quarter" | "year";
  notifications: boolean;
  aiAssistantName: string;
  defaultBroker?: string;
  quoteRefreshMode: "manual" | "daily" | "weekly";
}

export interface UserData {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  goals: Goal[];
  investments: InvestmentAsset[];
  operations: InvestmentOperation[];
  dividends: DividendIncome[];
  importBatches: ImportBatch[];
  insights: AIInsight[];
  chat: ChatMessage[];
  settings: UserSettings;
}

export interface ImportPreviewItem {
  id: string;
  selected: boolean;
  duplicate: boolean;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  categoryId: string;
  accountId: string;
  paymentMethod: string;
  notes?: string;
  source: TransactionSource;
}
