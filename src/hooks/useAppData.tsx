import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createDefaultUserData, UNCATEGORIZED_ID } from "../data/defaults";
import type {
  Category,
  Goal,
  ImportPreviewItem,
  InvestmentAsset,
  Transaction,
  User,
  UserData,
  UserSettings,
} from "../types";
import { recalculateAsset } from "../utils/finance";
import {
  getRemoteSessionUser,
  isSupabaseConfigured,
  loadRemoteUserData,
  requestPasswordResetRemote,
  saveRemoteUserData,
  signInRemote,
  signOutRemote,
  signUpRemote,
  updateRemotePassword,
} from "../services/supabaseClient";
import {
  clearSession,
  exportUserData,
  getSessionUser,
  getUserData,
  importUserData,
  login,
  loginDemo,
  makeId,
  register,
  requestPasswordReset,
  resetPassword,
  saveUserData,
  updateUser,
} from "../services/storage";

interface AppDataContextValue {
  user: User | null;
  data: UserData | null;
  supabaseReady: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  signIn: (email: string, password: string) => Promise<void>;
  signInDemo: () => void;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  changePassword: (email: string, password: string) => Promise<void>;
  updateProfile: (name: string) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  addTransaction: (transaction: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  deleteTransactions: (ids: string[]) => void;
  importTransactions: (items: ImportPreviewItem[], fileName: string, source: "csv" | "image") => void;
  addCategory: (category: Omit<Category, "id">) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addInvestment: (asset: Omit<InvestmentAsset, "id" | "createdAt" | "updatedAt">) => void;
  updateInvestment: (asset: InvestmentAsset) => void;
  deleteInvestment: (id: string) => void;
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  appendChat: (role: "user" | "assistant", content: string) => void;
  replaceInsights: (insights: UserData["insights"]) => void;
  exportJson: () => string;
  importJson: (payload: string) => void;
  syncToSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => getSessionUser());
  const [data, setData] = useState<UserData | null>(() => {
    const session = getSessionUser();
    return session ? getUserData(session.id) : null;
  });
  const [syncStatus, setSyncStatus] = useState<AppDataContextValue["syncStatus"]>("idle");

  useEffect(() => {
    document.documentElement.dataset.theme = data?.settings.theme ?? "light";
  }, [data?.settings.theme]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    async function restoreRemoteSession() {
      const remoteUser = await getRemoteSessionUser();
      if (!remoteUser || cancelled) return;
      const remoteData = await loadRemoteUserData(remoteUser.id);
      const initialData = remoteData ?? getUserData(remoteUser.id);
      if (!remoteData) await saveRemoteUserData(remoteUser.id, initialData);
      if (!cancelled) {
        setUser(remoteUser);
        setData(initialData);
      }
    }
    restoreRemoteSession().catch(() => setSyncStatus("error"));
    return () => {
      cancelled = true;
    };
  }, []);

  function persist(next: UserData) {
    if (!user) return;
    setData(next);
    saveUserData(user.id, next);
    if (isSupabaseConfigured) {
      saveRemoteUserData(user.id, next)
        .then(() => setSyncStatus("synced"))
        .catch(() => setSyncStatus("error"));
    }
  }

  function withData(updater: (current: UserData) => UserData) {
    if (!data) return;
    persist(updater(data));
  }

  const value: AppDataContextValue = {
      user,
      data,
      supabaseReady: isSupabaseConfigured,
      syncStatus,
      async signIn(email, password) {
        if (isSupabaseConfigured) {
          const authenticated = await signInRemote(email, password);
          if (!authenticated) return;
          const remoteData = await loadRemoteUserData(authenticated.id);
          const initialData = remoteData ?? getUserData(authenticated.id);
          if (!remoteData) await saveRemoteUserData(authenticated.id, initialData);
          setUser(authenticated);
          setData(initialData);
          return;
        }
        const authenticated = login(email, password);
        setUser(authenticated);
        setData(getUserData(authenticated.id));
      },
      signInDemo() {
        const authenticated = loginDemo();
        setUser(authenticated);
        setData(getUserData(authenticated.id));
      },
      async signUp(name, email, password) {
        if (isSupabaseConfigured) {
          const created = await signUpRemote(name, email, password);
          if (!created) return;
          const initialData = createDefaultUserData();
          await saveRemoteUserData(created.id, initialData);
          saveUserData(created.id, initialData);
          setUser(created);
          setData(initialData);
          return;
        }
        const created = register(name, email, password);
        setUser(created);
        setData(getUserData(created.id));
      },
      async signOut() {
        if (isSupabaseConfigured) await signOutRemote();
        clearSession();
        setUser(null);
        setData(null);
      },
      async forgotPassword(email) {
        if (isSupabaseConfigured) return requestPasswordResetRemote(email);
        return requestPasswordReset(email);
      },
      async changePassword(email, password) {
        if (isSupabaseConfigured) {
          await updateRemotePassword(password);
          return;
        }
        const updated = resetPassword(email, password);
        setUser(updated);
      },
      updateProfile(name) {
        if (!user) return;
        const updated = { ...user, name: name.trim() || user.name };
        updateUser(updated);
        setUser(updated);
      },
      updateSettings(settings) {
        withData((current) => ({
          ...current,
          settings: { ...current.settings, ...settings },
        }));
      },
      addTransaction(transaction) {
        const timestamp = new Date().toISOString();
        withData((current) => ({
          ...current,
          transactions: [
            {
              ...transaction,
              id: makeId("tr"),
              tags: transaction.tags ?? [],
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            ...current.transactions,
          ],
        }));
      },
      updateTransaction(transaction) {
        withData((current) => ({
          ...current,
          transactions: current.transactions.map((item) =>
            item.id === transaction.id ? { ...transaction, updatedAt: new Date().toISOString() } : item,
          ),
        }));
      },
      deleteTransaction(id) {
        withData((current) => ({
          ...current,
          transactions: current.transactions.filter((item) => item.id !== id),
        }));
      },
      deleteTransactions(ids) {
        withData((current) => ({
          ...current,
          transactions: current.transactions.filter((item) => !ids.includes(item.id)),
        }));
      },
      importTransactions(items, fileName, source) {
        const selected = items.filter((item) => item.selected && !item.duplicate);
        const batchId = makeId("batch");
        const timestamp = new Date().toISOString();
        withData((current) => ({
          ...current,
          importBatches: [
            {
              id: batchId,
              source,
              fileName,
              createdAt: timestamp,
              status: "imported",
              itemsTotal: items.length,
              importedTotal: selected.length,
            },
            ...current.importBatches,
          ],
          transactions: [
            ...selected.map<Transaction>((item) => ({
              id: makeId("tr"),
              type: item.type,
              amount: item.amount,
              date: item.date,
              description: item.description,
              categoryId: item.categoryId,
              accountId: item.accountId,
              paymentMethod: item.paymentMethod,
              status: "paid",
              notes: item.notes,
              tags: ["importado"],
              source: item.source,
              importBatchId: batchId,
              createdAt: timestamp,
              updatedAt: timestamp,
            })),
            ...current.transactions,
          ],
        }));
      },
      addCategory(category) {
        withData((current) => ({
          ...current,
          categories: [{ ...category, id: makeId("cat") }, ...current.categories],
        }));
      },
      updateCategory(category) {
        withData((current) => ({
          ...current,
          categories: current.categories.map((item) => (item.id === category.id ? category : item)),
        }));
      },
      deleteCategory(id) {
        if (id === UNCATEGORIZED_ID) return;
        withData((current) => ({
          ...current,
          categories: current.categories.filter((item) => item.id !== id),
          transactions: current.transactions.map((transaction) =>
            transaction.categoryId === id ? { ...transaction, categoryId: UNCATEGORIZED_ID } : transaction,
          ),
          goals: current.goals.map((goal) => (goal.categoryId === id ? { ...goal, categoryId: UNCATEGORIZED_ID } : goal)),
        }));
      },
      addInvestment(asset) {
        const timestamp = new Date().toISOString();
        withData((current) => ({
          ...current,
          investments: [
            recalculateAsset({
              ...asset,
              id: makeId("inv"),
              createdAt: timestamp,
              updatedAt: timestamp,
            }),
            ...current.investments,
          ],
        }));
      },
      updateInvestment(asset) {
        withData((current) => ({
          ...current,
          investments: current.investments.map((item) =>
            item.id === asset.id ? recalculateAsset({ ...asset, updatedAt: new Date().toISOString() }) : item,
          ),
        }));
      },
      deleteInvestment(id) {
        withData((current) => ({
          ...current,
          investments: current.investments.filter((item) => item.id !== id),
          dividends: current.dividends.filter((item) => item.assetId !== id),
          operations: current.operations.filter((item) => item.assetId !== id),
        }));
      },
      addGoal(goal) {
        withData((current) => ({
          ...current,
          goals: [{ ...goal, id: makeId("goal"), createdAt: new Date().toISOString() }, ...current.goals],
        }));
      },
      updateGoal(goal) {
        withData((current) => ({
          ...current,
          goals: current.goals.map((item) => (item.id === goal.id ? goal : item)),
        }));
      },
      deleteGoal(id) {
        withData((current) => ({
          ...current,
          goals: current.goals.filter((item) => item.id !== id),
        }));
      },
      appendChat(role, content) {
        withData((current) => ({
          ...current,
          chat: [
            ...current.chat,
            {
              id: makeId("chat"),
              role,
              content,
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },
      replaceInsights(insights) {
        withData((current) => ({ ...current, insights }));
      },
      exportJson() {
        if (!user) return "{}";
        return exportUserData(user.id);
      },
      importJson(payload) {
        if (!user) return;
        const imported = importUserData(user.id, payload);
        setData(imported);
      },
      async syncToSupabase() {
        if (!user || !data || !isSupabaseConfigured) return;
        setSyncStatus("syncing");
        try {
          await saveRemoteUserData(user.id, data);
          setSyncStatus("synced");
        } catch {
          setSyncStatus("error");
        }
      },
      async loadFromSupabase() {
        if (!user || !isSupabaseConfigured) return;
        setSyncStatus("syncing");
        try {
          const remote = await loadRemoteUserData(user.id);
          if (remote) {
            saveUserData(user.id, remote);
            setData(remote);
          }
          setSyncStatus("synced");
        } catch {
          setSyncStatus("error");
        }
      },
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components
export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error("useAppData deve ser usado dentro de AppDataProvider.");
  return context;
}
