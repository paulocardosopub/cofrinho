import {
  createDemoUserData,
  createDefaultUserData,
  DEFAULT_ACCOUNT_ID,
  DEMO_USER_ID,
  UNCATEGORIZED_ID,
} from "../data/defaults";
import type { Category, InvestmentAsset, Transaction, User, UserData } from "../types";

const USERS_KEY = "cofrinho_users";
const SESSION_KEY = "cofrinho_session";
const DATA_PREFIX = "cofrinho_data";
const RESET_EMAIL_KEY = "cofrinho_reset_email";
const LEGACY_USERS_KEY = "cardoso_finance_users";
const LEGACY_SESSION_KEY = "cardoso_finance_session";
const LEGACY_DATA_PREFIX = "cardoso_finance_data";
const LEGACY_RESET_EMAIL_KEY = "cardoso_finance_reset_email";
const DEMO_EMAIL = "paulo@cofrinho.local";
const LEGACY_DEMO_EMAIL = "paulo@cardosofinance.local";

let migratedLegacyStorage = false;

function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function makeId(prefix: string) {
  const random = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${random}`;
}

export function hashCredential(email: string, password: string) {
  const input = `${email.trim().toLowerCase()}:${password}`;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index);
    hash |= 0;
  }
  return `local-${Math.abs(hash)}`;
}

function migrateLegacyStorage() {
  if (migratedLegacyStorage) return;
  migratedLegacyStorage = true;

  const legacyUsers = safeJsonParse<User[]>(localStorage.getItem(LEGACY_USERS_KEY), []);
  if (legacyUsers.length && !localStorage.getItem(USERS_KEY)) {
    saveUsers(
      legacyUsers.map((user) =>
        user.id === DEMO_USER_ID || user.email === LEGACY_DEMO_EMAIL
          ? { ...user, email: DEMO_EMAIL, passwordHash: hashCredential(DEMO_EMAIL, "demo123") }
          : user,
      ),
    );
  }

  const legacySession = localStorage.getItem(LEGACY_SESSION_KEY);
  if (legacySession && !localStorage.getItem(SESSION_KEY)) {
    localStorage.setItem(SESSION_KEY, legacySession);
  }

  const legacyResetEmail = localStorage.getItem(LEGACY_RESET_EMAIL_KEY);
  if (legacyResetEmail && !localStorage.getItem(RESET_EMAIL_KEY)) {
    localStorage.setItem(RESET_EMAIL_KEY, legacyResetEmail === LEGACY_DEMO_EMAIL ? DEMO_EMAIL : legacyResetEmail);
  }

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key?.startsWith(`${LEGACY_DATA_PREFIX}_`)) continue;
    const newKey = `${DATA_PREFIX}_${key.slice(`${LEGACY_DATA_PREFIX}_`.length)}`;
    if (!localStorage.getItem(newKey)) {
      const value = localStorage.getItem(key);
      if (value) localStorage.setItem(newKey, value);
    }
  }
}

export function getUsers() {
  migrateLegacyStorage();
  ensureDemoUser();
  return safeJsonParse<User[]>(localStorage.getItem(USERS_KEY), []);
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function ensureDemoUser() {
  migrateLegacyStorage();
  const existing = safeJsonParse<User[]>(localStorage.getItem(USERS_KEY), []);
  if (existing.some((user) => user.id === DEMO_USER_ID)) return;

  const demoUser: User = {
    id: DEMO_USER_ID,
    name: "Paulo Cardoso",
    email: DEMO_EMAIL,
    passwordHash: hashCredential(DEMO_EMAIL, "demo123"),
    createdAt: new Date().toISOString(),
  };

  saveUsers([demoUser, ...existing]);
  if (!localStorage.getItem(dataKey(DEMO_USER_ID))) {
    saveUserData(DEMO_USER_ID, createDemoUserData());
  }
}

export function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user || user.passwordHash !== hashCredential(normalizedEmail, password)) {
    throw new Error("E-mail ou senha inválidos.");
  }
  setSession(user.id);
  return user;
}

export function loginDemo() {
  ensureDemoUser();
  setSession(DEMO_USER_ID);
  return getUsers().find((user) => user.id === DEMO_USER_ID)!;
}

export function register(name: string, email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    throw new Error("Já existe uma conta com esse e-mail.");
  }
  if (password.length < 6) {
    throw new Error("Use uma senha com pelo menos 6 caracteres.");
  }

  const user: User = {
    id: makeId("user"),
    name: name.trim() || normalizedEmail.split("@")[0],
    email: normalizedEmail,
    passwordHash: hashCredential(normalizedEmail, password),
    createdAt: new Date().toISOString(),
  };

  saveUsers([user, ...users]);
  saveUserData(user.id, createDefaultUserData());
  setSession(user.id);
  return user;
}

export function updateUser(user: User) {
  const users = getUsers().map((item) => (item.id === user.id ? user : item));
  saveUsers(users);
}

export function requestPasswordReset(email: string) {
  const exists = getUsers().some((user) => user.email.toLowerCase() === email.trim().toLowerCase());
  if (!exists) return false;
  localStorage.setItem(RESET_EMAIL_KEY, email.trim().toLowerCase());
  return true;
}

export function resetPassword(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = getUsers();
  const user = users.find((item) => item.email.toLowerCase() === normalizedEmail);
  if (!user) throw new Error("Conta não encontrada.");
  if (password.length < 6) throw new Error("Use uma senha com pelo menos 6 caracteres.");
  user.passwordHash = hashCredential(normalizedEmail, password);
  saveUsers(users);
  return user;
}

export function getSessionUser() {
  const userId = localStorage.getItem(SESSION_KEY);
  if (!userId) return null;
  return getUsers().find((user) => user.id === userId) ?? null;
}

export function setSession(userId: string) {
  localStorage.setItem(SESSION_KEY, userId);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function dataKey(userId: string) {
  return `${DATA_PREFIX}_${userId}`;
}

export function getUserData(userId: string): UserData {
  const existing = safeJsonParse<UserData | null>(localStorage.getItem(dataKey(userId)), null);
  if (!existing) {
    const created = createDefaultUserData();
    saveUserData(userId, created);
    return created;
  }
  return normalizeData(existing);
}

export function saveUserData(userId: string, data: UserData) {
  localStorage.setItem(dataKey(userId), JSON.stringify(normalizeData(data)));
}

export function exportUserData(userId: string) {
  return JSON.stringify(getUserData(userId), null, 2);
}

interface InvestmentMigrationPayload {
  cofrinhoMigrationVersion: number;
  source?: string;
  mode?: string;
  categories?: Category[];
  investments?: InvestmentAsset[];
}

function isInvestmentMigration(payload: unknown): payload is InvestmentMigrationPayload {
  const candidate = payload as InvestmentMigrationPayload;
  return candidate?.cofrinhoMigrationVersion === 1 && Array.isArray(candidate.investments);
}

function investmentMergeKey(asset: InvestmentAsset) {
  return [
    asset.id,
    asset.ticker?.trim().toUpperCase(),
    asset.name?.trim().toUpperCase(),
    asset.buyDate,
    asset.maturityDate ?? "",
    Number(asset.investedValue || 0).toFixed(2),
  ].join("|");
}

function categoryMergeKey(category: Category) {
  return `${category.name.trim().toLowerCase()}|${category.type}`;
}

function mergeInvestmentMigration(current: UserData, migration: InvestmentMigrationPayload): UserData {
  const now = new Date().toISOString();
  const importedCategories = (migration.categories ?? []).map((category) => ({
    ...category,
    id: category.id || makeId("category"),
    type: category.type || "investment",
    color: category.color || "#2563eb",
    icon: category.icon || "Landmark",
  }));
  const importedInvestments = (migration.investments ?? []).map((asset, index) => ({
    ...asset,
    id: asset.id || makeId("investment"),
    quantity: Number(asset.quantity || 1),
    averagePrice: Number(asset.averagePrice || asset.investedValue || 0),
    currentPrice: Number(asset.currentPrice || asset.currentValue || asset.investedValue || 0),
    investedValue: Number(asset.investedValue || 0),
    currentValue: Number(asset.currentValue || asset.investedValue || 0),
    dividends: Number(asset.dividends || 0),
    buyDate: asset.buyDate || now.slice(0, 10),
    createdAt: asset.createdAt || now,
    updatedAt: asset.updatedAt || now,
    notes: asset.notes || `Importado de ${migration.source ?? "migração"} #${index + 1}.`,
  }));
  const incomingCategoryKeys = new Set(importedCategories.map(categoryMergeKey));
  const incomingKeys = new Set(importedInvestments.map(investmentMergeKey));
  const keptCategories = current.categories.filter((category) => !incomingCategoryKeys.has(categoryMergeKey(category)));
  const keptInvestments = current.investments.filter((asset) => !incomingKeys.has(investmentMergeKey(asset)));

  return normalizeData({
    ...current,
    categories: [...keptCategories, ...importedCategories],
    investments: [...keptInvestments, ...importedInvestments],
    importBatches: [
      {
        id: makeId("batch"),
        source: "json",
        fileName: migration.source ?? "migração de investimentos",
        createdAt: now,
        status: "imported",
        itemsTotal: importedInvestments.length + importedCategories.length,
        importedTotal: importedInvestments.length + importedCategories.length,
      },
      ...current.importBatches,
    ],
  });
}

export function importUserData(userId: string, payload: string, currentData?: UserData) {
  const parsed = JSON.parse(payload) as UserData | InvestmentMigrationPayload;
  const normalized = isInvestmentMigration(parsed)
    ? mergeInvestmentMigration(normalizeData(currentData ?? getUserData(userId)), parsed)
    : normalizeData(parsed as UserData);
  saveUserData(userId, normalized);
  return normalized;
}

export function normalizeData(data: UserData): UserData {
  const categories = data.categories?.length ? data.categories : createDefaultUserData().categories;
  const hasUncategorized = categories.some((category) => category.id === UNCATEGORIZED_ID);
  const normalizedCategories: Category[] = hasUncategorized
    ? categories
    : [{ id: UNCATEGORIZED_ID, name: "Sem categoria", type: "both", color: "#64748b", icon: "Circle" }, ...categories];

  const accounts = data.accounts?.length ? data.accounts : createDefaultUserData().accounts;
  const accountIds = new Set(accounts.map((account) => account.id));
  const categoryIds = new Set(normalizedCategories.map((category) => category.id));
  const transactions: Transaction[] = (data.transactions ?? []).map((transaction) => ({
    ...transaction,
    accountId: accountIds.has(transaction.accountId) ? transaction.accountId : DEFAULT_ACCOUNT_ID,
    categoryId: categoryIds.has(transaction.categoryId) ? transaction.categoryId : UNCATEGORIZED_ID,
    tags: transaction.tags ?? [],
  }));

  const defaultData = createDefaultUserData();
  const migratedSettings =
    data.settings?.visualVersion === 2
      ? data.settings
      : {
          ...defaultData.settings,
          ...data.settings,
          theme: "dark" as const,
          visualVersion: 2,
        };

  return {
    accounts,
    categories: normalizedCategories,
    transactions,
    goals: data.goals ?? [],
    investments: data.investments ?? [],
    operations: data.operations ?? [],
    dividends: data.dividends ?? [],
    importBatches: data.importBatches ?? [],
    insights: data.insights ?? [],
    chat: data.chat ?? [],
    settings: migratedSettings,
  };
}
