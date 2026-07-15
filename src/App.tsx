import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  BrowserRouter,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Bitcoin,
  Bot,
  Boxes,
  Building2,
  Car,
  CheckCircle2,
  ChevronRight,
  Circle,
  CreditCard,
  Download,
  Edit3,
  FileSpreadsheet,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  MoreHorizontal,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  TrendingUp,
  Tv,
  Upload,
  Utensils,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import "./App.css";
import { AppDataProvider, useAppData } from "./hooks/useAppData";
import { analyzeImageFiles, parseCsvFile } from "./services/importService";
import { aiService } from "./services/aiService";
import { fetchFundQuotes, type FundQuote } from "./services/marketData";
import { analyzeInvestmentScreenshots, type InvestmentImageAnalysis, type InvestmentImageUpdate } from "./services/investmentImageService";
import type {
  AssetType,
  Category,
  DividendIncome,
  Goal,
  ImportPreviewItem,
  InvestmentAsset,
  Transaction,
  TransactionStatus,
  TransactionType,
} from "./types";
import {
  assetTypeLabel,
  calculateDashboard,
  calculateGoalProgress,
  FII_CATEGORY_NAME,
  getCategoryMap,
  getDividendsByMonth,
  getDetailedInvestments,
  getFiiInvestments,
  getInvestmentEvolution,
  getInvestmentAllocation,
  getNonFiiInvestments,
  getPortfolioInvestments,
  getMonthlyCashflow,
  getPortfolioEvolution,
  groupExpensesByCategory,
  isFiiCategoryName,
  isFiiInvestment,
} from "./utils/finance";
import { formatCurrency, formatDate, formatPercent, toInputDate } from "./utils/format";

const chartColors = ["#14b8a6", "#38bdf8", "#a78bfa", "#fbbf24", "#fb7185", "#34d399", "#818cf8", "#f97316"];
const routerBasename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL;

const navigation = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/transacoes", label: "Transações", icon: ReceiptText },
  { to: "/categorias", label: "Categorias", icon: Tags },
  { to: "/investimentos", label: "Investimentos", icon: Landmark },
  { to: "/guru", label: "Guru", icon: Bot },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/configuracoes", label: "Config", icon: Settings },
];

const mobileNavigation = [
  { to: "/", label: "Início", icon: Home },
  { to: "/transacoes", label: "Movimentos", icon: ReceiptText },
  { to: "/investimentos", label: "Carteira", icon: Landmark },
  { to: "/guru", label: "Guru", icon: Bot },
  { to: "/configuracoes", label: "Mais", icon: MoreHorizontal },
];

const categoryIcons: Record<string, LucideIcon> = {
  BadgeDollarSign,
  Bitcoin,
  Boxes,
  Building2,
  Car,
  Circle,
  CreditCard,
  Gamepad2,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Tags,
  TrendingUp,
  Tv,
  Utensils,
  Wallet: WalletCards,
};

function App() {
  return (
    <AppDataProvider>
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/reset-password" element={<AuthPage mode="reset" />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="transacoes" element={<TransactionsPage />} />
              <Route path="categorias" element={<CategoriesPage />} />
              <Route path="categories" element={<Navigate to="/categorias" replace />} />
              <Route path="Categories" element={<Navigate to="/categorias" replace />} />
              <Route path="investimentos" element={<InvestmentsPage />} />
              <Route path="guru" element={<GuruPage />} />
              <Route path="relatorios" element={<ReportsPage />} />
              <Route path="configuracoes" element={<SettingsPage />} />
              <Route path="mineracao" element={<Navigate to="/investimentos" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}

function ProtectedRoute() {
  const { user } = useAppData();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function TechBackdrop() {
  return (
    <div className="tech-backdrop" aria-hidden="true">
      <div className="tech-grid" />
      <div className="tech-stream tech-stream-a" />
      <div className="tech-stream tech-stream-b" />
      <div className="tech-network">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function AppLayout() {
  const { user, signOut, data } = useAppData();
  const summary = data ? calculateDashboard(data) : null;

  return (
    <>
      <TechBackdrop />
      <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">CF</div>
          <div>
            <strong>Cofrinho App</strong>
            <span>por Paulo Cardoso</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to}>
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="tiny-card">
            <span>Patrimônio</span>
            <strong>{summary ? formatCurrency(summary.current) : formatCurrency(0)}</strong>
          </div>
          <button className="ghost-button" type="button" onClick={signOut}>
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-copy">
            <span className="eyebrow tech-status">
              <ShieldCheck size={15} />
              Carteira segura, sem conexão bancária obrigatória
            </span>
            <h1>Cofrinho App</h1>
          </div>
          <div className="mobile-brand" aria-label="Cofrinho App">
            <div className="brand-mark">CF</div>
            <div>
              <strong>Cofrinho</strong>
              <span>suas finanças</span>
            </div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-shortcuts" aria-label="Atalhos">
              <NavLink className="icon-button" to="/relatorios" aria-label="Relatórios">
                <BarChart3 size={17} />
              </NavLink>
              <NavLink className="icon-button" to="/configuracoes" aria-label="Configurações">
                <Settings size={17} />
              </NavLink>
            </div>
            <div className="user-pill">
              <UserRound size={17} />
              <span>{user?.name}</span>
            </div>
          </div>
        </header>
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegação mobile">
        {mobileNavigation.map((item) => (
          <NavLink key={item.to} to={item.to}>
            <item.icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      </div>
    </>
  );
}

function AuthPage({ mode }: { mode: "login" | "register" | "forgot" | "reset" }) {
  const { signIn, signInDemo, signUp, forgotPassword, changePassword, user, supabaseReady } = useAppData();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");

  if (user) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      if (mode === "login") {
        await signIn(email, password);
      }
      if (mode === "register") {
        if (password !== confirm) throw new Error("As senhas não conferem.");
        const status = await signUp(name, email, password);
        if (status === "confirmation-sent") {
          setMessage("Usuário criado. Confirme seu e-mail e depois volte para entrar.");
        }
      }
      if (mode === "forgot") {
        const sent = await forgotPassword(email);
        setMessage(
          sent
            ? supabaseReady
              ? "Enviamos as instruções de recuperação pelo Supabase."
              : "Link simulado criado. Abra a tela de reset para definir uma nova senha."
            : "Se o e-mail existir, enviaremos as instruções.",
        );
      }
      if (mode === "reset") {
        await changePassword(email, password);
        navigate("/login");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível concluir.");
    }
  }

  const title = {
    login: "Entrar",
    register: "Criar usuário",
    forgot: "Recuperar senha",
    reset: "Definir nova senha",
  }[mode];

  const subtitle = {
    login: "Acesse sua carteira salva no Supabase ou use o modo demo para testar.",
    register: "Comece com uma conta vazia, pronta para receber seus próprios dados.",
    forgot: "Informe seu e-mail para receber as instruções de recuperação.",
    reset: "Escolha uma nova senha para voltar ao Cofrinho.",
  }[mode];

  return (
    <>
      <TechBackdrop />
      <main className="auth-page">
        <section className="auth-panel">
          <div className="auth-showcase">
            <div className="brand auth-brand">
              <div className="brand-mark">CF</div>
              <div>
                <strong>Cofrinho App</strong>
                <span>controle mobile com IA e prints</span>
              </div>
            </div>
            <div className="auth-copy">
              <span className="eyebrow tech-status">
                <ShieldCheck size={15} />
                Conta salva no Supabase
              </span>
              <h1>{title}</h1>
              <p>{subtitle}</p>
            </div>
            <div className="auth-orbit" aria-hidden="true">
              <div className="auth-orbit-core">
                <ShieldCheck size={28} />
              </div>
              <span />
              <span />
            </div>
            <div className="auth-benefits">
              <span><ShieldCheck size={16} />Dados sincronizados</span>
              <span><Upload size={16} />Importação por print</span>
              <span><Sparkles size={16} />Carteira inicial vazia</span>
            </div>
          </div>

          <div className="auth-form-card">
            <form className="form-grid" onSubmit={submit}>
              {mode === "register" ? (
                <label>
                  Usuário
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Como quer ser chamado?" autoComplete="name" />
                </label>
              ) : null}
              <label>
                E-mail
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu@email.com" autoComplete="email" />
              </label>
              {mode !== "forgot" ? (
                <label>
                  Senha
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} />
                </label>
              ) : null}
              {mode === "register" ? (
                <label>
                  Confirmar senha
                  <input type="password" value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repita sua senha" autoComplete="new-password" />
                </label>
              ) : null}
              {message ? <div className="inline-alert span-2">{message}</div> : null}
              <button className="primary-button" type="submit">
                <ShieldCheck size={18} />
                {mode === "login" ? "Entrar" : mode === "register" ? "Criar usuário" : mode === "forgot" ? "Enviar instruções" : "Salvar senha"}
              </button>
              {mode === "login" ? (
                <button className="secondary-button" type="button" onClick={signInDemo}>
                  <Sparkles size={18} />
                  Modo demo
                </button>
              ) : null}
            </form>
            <div className="auth-links">
              {mode !== "login" ? <NavLink to="/login">Voltar ao login</NavLink> : <NavLink to="/forgot-password">Esqueci minha senha</NavLink>}
              {mode !== "register" ? <NavLink to="/register">Criar usuário</NavLink> : null}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

function DashboardPage() {
  const { data, updateInvestment } = useRequiredData();
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [quotes, setQuotes] = useState<Record<string, FundQuote>>({});
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [quotesError, setQuotesError] = useState("");
  const summary = calculateDashboard(data, month);
  const categories = groupExpensesByCategory(data.transactions, data.categories, month);
  const cashflow = getMonthlyCashflow(data.transactions, 6);
  const nonFiiInvestments = getNonFiiInvestments(data.investments);
  const allocation = getInvestmentAllocation(nonFiiInvestments, "category");
  const investmentEvolution = getInvestmentEvolution(data.investments, data.dividends, 6);
  const fiiAssets = getDetailedInvestments(data.investments).filter((asset) => asset.assetType === "fii");
  const latest = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const latestQuote = Object.values(quotes).sort((a, b) => b.fetchedAt.localeCompare(a.fetchedAt))[0];
  const quoteStatus = quotesLoading
    ? "Buscando cotas..."
    : latestQuote
      ? `${latestQuote.source} · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(latestQuote.fetchedAt))}`
      : "Ainda não atualizado";

  async function refreshFiiQuotes() {
    if (!fiiAssets.length) return;
    setQuotesLoading(true);
    setQuotesError("");
    try {
      const freshQuotes = await fetchFundQuotes(fiiAssets);
      const nextQuotes = Object.fromEntries(freshQuotes.map((quote) => [quote.ticker, quote]));
      setQuotes((current) => ({ ...current, ...nextQuotes }));
      freshQuotes.forEach((quote) => {
        const asset = fiiAssets.find((item) => normalizeTicker(item.ticker) === quote.ticker);
        if (!asset || quote.price <= 0) return;
        updateInvestment({
          ...asset,
          currentPrice: quote.price,
          currentValue: asset.quantity * quote.price,
          updatedAt: new Date().toISOString(),
        });
      });
    } catch {
      setQuotesError("Não consegui atualizar as cotas online agora. Mantive os valores salvos.");
    } finally {
      setQuotesLoading(false);
    }
  }

  return (
    <Page title="Painel Financeiro" action={<input className="month-input" type="month" value={month} onChange={(event) => setMonth(event.target.value)} />}>
      <div className="stats-grid dashboard-focus-stats">
        <StatCard icon={TrendingIcon} label="Resultado do mês" value={formatCurrency(summary.investmentReturn)} tone={summary.investmentReturn >= 0 ? "green" : "red"} />
        <StatCard icon={Landmark} label="Patrimônio investido" value={formatCurrency(summary.current)} tone="purple" />
        <StatCard icon={TrendingIcon} label="Rentabilidade" value={formatPercent(summary.investmentReturnRate)} tone={summary.investmentReturn >= 0 ? "green" : "red"} />
      </div>

      <div className="dashboard-grid">
        <Panel title="Evolução dos investimentos">
          <ChartBox>
            <ResponsiveContainer>
              <ComposedChart data={investmentEvolution} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="portfolioCurrentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5eead4" stopOpacity={0.62} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.06} />
                  </linearGradient>
                  <linearGradient id="portfolioInvestedArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Area type="monotone" dataKey="investido" stroke="#60a5fa" strokeWidth={2} fill="url(#portfolioInvestedArea)" name="Investido" />
                <Area type="monotone" dataKey="atual" stroke="#5eead4" strokeWidth={3} fill="url(#portfolioCurrentArea)" name="Valor atual" />
                <Line type="monotone" dataKey="proventos" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3, fill: "#a78bfa" }} name="Proventos" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
        <Panel title="Evolução do saldo">
          <ChartBox>
            <ResponsiveContainer>
              <AreaChart data={cashflow} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="balanceArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area type="monotone" dataKey="acumulado" stroke="#38bdf8" strokeWidth={3} fill="url(#balanceArea)" name="Saldo" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
        <Panel title="Despesas por categoria" mobileDefaultCollapsed>
          {categories.length ? <PieChartBlock data={categories.map((item) => ({ name: item.name, value: item.value }))} /> : <EmptyState title="Sem despesas no período" text="Importe transações ou cadastre uma saída para preencher este gráfico." />}
        </Panel>
        <Panel title="Distribuição dos outros investimentos" mobileDefaultCollapsed>
          {allocation.length ? <PieChartBlock data={allocation} /> : <EmptyState title="Carteira vazia" text="Cadastre CDBs, renda fixa, ações ou outros investimentos para acompanhar a distribuição." />}
        </Panel>
        <div className="dashboard-wide">
          <Panel
            title="Radar de FIIs"
            mobileDefaultCollapsed
            action={(
              <div className="quote-refresh-action">
                <button className="secondary-button" type="button" onClick={() => void refreshFiiQuotes()} disabled={quotesLoading || !fiiAssets.length}>
                  {quotesLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                  Atualizar cotas
                </button>
                <small>{quoteStatus}</small>
              </div>
            )}
          >
            <FiiRadarPanel assets={fiiAssets} dividends={data.dividends} quotes={quotes} loading={quotesLoading} error={quotesError} />
          </Panel>
        </div>
      </div>

      <div className="two-column">
        <Panel title="Últimas transações" action={<NavLink className="text-link" to="/transacoes">Ver todas</NavLink>}>
          <TransactionList transactions={latest} />
        </Panel>
        <Panel title="Alertas e insights" mobileDefaultCollapsed>
          <div className="insight-list">
            {data.insights.slice(0, 4).map((insight) => (
              <div className={`insight insight-${insight.severity}`} key={insight.id}>
                <Sparkles size={18} />
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </Page>
  );
}

function TransactionsPage() {
  const { data, addTransaction, updateTransaction, deleteTransaction, deleteTransactions, importTransactions, addCategory, updateCategory, deleteCategory } = useRequiredData();
  const categoryMap = useMemo(() => getCategoryMap(data.categories), [data.categories]);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryEditing, setCategoryEditing] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState({ text: "", type: "all", category: "all", status: "all" });
  const transactionSummary = calculateDashboard(data);
  const transactionCashflow = getMonthlyCashflow(data.transactions, 6);

  const filtered = data.transactions
    .filter((transaction) => {
      const textMatch = `${transaction.description} ${transaction.notes ?? ""}`.toLowerCase().includes(filters.text.toLowerCase());
      const typeMatch = filters.type === "all" || transaction.type === filters.type;
      const categoryMatch = filters.category === "all" || transaction.categoryId === filters.category;
      const statusMatch = filters.status === "all" || transaction.status === filters.status;
      return textMatch && typeMatch && categoryMatch && statusMatch;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  function openNew(type: TransactionType) {
    setEditing(createEmptyTransaction(type, data.accounts[0]?.id));
    setFormOpen(true);
  }

  function save(transaction: Transaction) {
    if (data.transactions.some((item) => item.id === transaction.id)) updateTransaction(transaction);
    else {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = transaction;
      addTransaction(payload);
    }
    setFormOpen(false);
    setEditing(null);
  }

  function saveTransactionCategory(category: Category) {
    if (data.categories.some((item) => item.id === category.id)) updateCategory(category);
    else {
      const { id: _id, ...payload } = category;
      addCategory(payload);
    }
    setCategoryEditing(null);
  }

  return (
    <Page
      title="Transações"
      action={
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={() => setCategoryManagerOpen(true)}>
            <Tags size={17} />
            Categorias
          </button>
          <button className="secondary-button" type="button" onClick={() => setImportOpen(true)}>
            <Upload size={17} />
            Importar extrato
          </button>
          <button className="danger-button" type="button" onClick={() => openNew("expense")}>
            <ReceiptText size={17} />
            Despesa
          </button>
          <button className="primary-button" type="button" onClick={() => openNew("income")}>
            <Plus size={17} />
            Receita
          </button>
        </div>
      }
    >
      <div className="stats-grid compact">
        <StatCard icon={WalletCards} label="Saldo atual" value={formatCurrency(transactionSummary.balance)} tone="green" />
        <StatCard icon={Banknote} label="Receitas do mês" value={formatCurrency(transactionSummary.income)} tone="blue" />
        <StatCard icon={ReceiptText} label="Despesas do mês" value={formatCurrency(transactionSummary.expenses)} tone="red" />
      </div>

      <Panel title="Receitas x despesas" mobileDefaultCollapsed>
        <ChartBox>
          <ResponsiveContainer>
            <BarChart data={transactionCashflow} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="transactionIncomeBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.45} />
                </linearGradient>
                <linearGradient id="transactionExpenseBar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.42} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="receitas" fill="url(#transactionIncomeBar)" name="Receitas" radius={[6, 6, 0, 0]} />
              <Bar dataKey="despesas" fill="url(#transactionExpenseBar)" name="Despesas" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>

      <Panel title="Filtros">
        <div className="filter-grid">
          <label className="search-field">
            <Search size={17} />
            <input value={filters.text} onChange={(event) => setFilters({ ...filters, text: event.target.value })} placeholder="Buscar descrição, observação ou tag" />
          </label>
          <select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}>
            <option value="all">Todos os tipos</option>
            <option value="income">Entrada</option>
            <option value="expense">Saída</option>
            <option value="investment">Investimento</option>
            <option value="credit">Crédito</option>
            <option value="transfer">Transferência</option>
          </select>
          <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
            <option value="all">Todas as categorias</option>
            {data.categories.map((category) => (
              <option value={category.id} key={category.id}>{category.name}</option>
            ))}
          </select>
          <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
            <option value="all">Todos os status</option>
            <option value="paid">Pago</option>
            <option value="pending">Pendente</option>
            <option value="planned">Planejado</option>
          </select>
        </div>
      </Panel>

      {selected.length ? (
        <div className="bulk-bar">
          <span>{selected.length} selecionada(s)</span>
          <button
            className="danger-button"
            type="button"
            onClick={() => {
              if (window.confirm("Excluir transações selecionadas?")) {
                deleteTransactions(selected);
                setSelected([]);
              }
            }}
          >
            <Trash2 size={16} />
            Excluir selecionadas
          </button>
        </div>
      ) : null}

      <Panel title={`Movimentos (${filtered.length})`}>
        {filtered.length ? (
          <>
            <TransactionMobileList
              transactions={filtered}
              investments={data.investments}
              categoryMap={categoryMap}
              selected={selected}
              onToggle={(id, checked) => setSelected((current) => checked ? [...current, id] : current.filter((item) => item !== id))}
              onEdit={(transaction) => { setEditing(transaction); setFormOpen(true); }}
              onDelete={deleteTransaction}
            />
            <div className="data-table-wrap transaction-desktop-table">
              <table className="data-table">
              <thead>
                <tr>
                  <th aria-label="Selecionar" />
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((transaction) => (
                  <tr key={transaction.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(transaction.id)}
                        onChange={(event) =>
                          setSelected((current) =>
                            event.target.checked ? [...current, transaction.id] : current.filter((id) => id !== transaction.id),
                          )
                        }
                      />
                    </td>
                    <td>{formatDate(transaction.date)}</td>
                    <td>
                      <strong>{transaction.description}</strong>
                      <span>{transactionFiiIncomeLabel(transaction, data.investments) || `${transaction.paymentMethod} · ${transaction.source}`}</span>
                    </td>
                    <td>
                      <Pill color={categoryMap.get(transaction.categoryId)?.color}>{categoryMap.get(transaction.categoryId)?.name ?? "Sem categoria"}</Pill>
                    </td>
                    <td>{transactionTypeLabel(transaction.type)}</td>
                    <td>{statusLabel(transaction.status)}</td>
                    <td className={transaction.type === "expense" || transaction.type === "investment" ? "amount-negative" : "amount-positive"}>
                      {transaction.type === "expense" || transaction.type === "investment" ? "-" : "+"}
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" type="button" aria-label="Editar" onClick={() => { setEditing(transaction); setFormOpen(true); }}>
                          <Edit3 size={16} />
                        </button>
                        <button className="icon-button danger-icon" type="button" aria-label="Excluir" onClick={() => window.confirm("Excluir esta transação?") && deleteTransaction(transaction.id)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState title="Nenhuma transação encontrada" text="Ajuste os filtros, cadastre manualmente ou importe um extrato." />
        )}
      </Panel>

      <Modal title={editing?.createdAt ? "Editar transação" : "Nova transação"} open={formOpen} onClose={() => setFormOpen(false)}>
        {editing ? <TransactionForm transaction={editing} data={data} onSave={save} /> : null}
      </Modal>
      <Modal title="Importar extrato bancário" open={importOpen} onClose={() => setImportOpen(false)} wide>
        <ImportFlow data={data} onImport={(items, fileName, source) => { importTransactions(items, fileName, source); setImportOpen(false); }} />
      </Modal>
      <Modal
        title={categoryEditing ? (categoryEditing.id === "new" ? "Nova categoria" : "Editar categoria") : "Categorias de receitas e despesas"}
        open={categoryManagerOpen}
        onClose={() => { setCategoryManagerOpen(false); setCategoryEditing(null); }}
        wide
      >
        {categoryEditing ? (
          <div className="category-manager-editor">
            <button className="ghost-button" type="button" onClick={() => setCategoryEditing(null)}><ArrowLeft size={16} />Voltar para categorias</button>
            <CategoryForm key={categoryEditing.id} category={categoryEditing} onSave={saveTransactionCategory} />
          </div>
        ) : (
          <div className="category-manager">
            <div className="category-manager-header">
              <p>Crie e organize as opções disponíveis nos formulários de receitas e despesas.</p>
              <button className="primary-button" type="button" onClick={() => setCategoryEditing(createEmptyCategory("expense"))}><Plus size={17} />Nova categoria</button>
            </div>
            <CategoryAdminList
              categories={data.categories.filter((category) => category.type !== "investment")}
              onEdit={setCategoryEditing}
              onDelete={(category) => {
                const inUse = data.transactions.some((transaction) => transaction.categoryId === category.id);
                const message = inUse ? "Categoria em uso. As transações serão movidas para Sem categoria. Continuar?" : "Excluir esta categoria?";
                if (window.confirm(message)) deleteCategory(category.id);
              }}
            />
          </div>
        )}
      </Modal>
    </Page>
  );
}

function CategoriesPage() {
  const { data, addCategory, updateCategory, deleteCategory } = useRequiredData();
  const [editing, setEditing] = useState<Category | null>(null);
  const usage = useMemo(
    () =>
      data.categories.map((category) => {
        const transactions = data.transactions.filter((transaction) => transaction.categoryId === category.id);
        const investments = getPortfolioInvestments(data.investments).filter((asset) => sameCategory(asset.category, category.name));
        const detailedInvestments = getDetailedInvestments(data.investments).filter((asset) => sameCategory(asset.category, category.name));
        const spent = transactions.filter((transaction) => transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0);
        const invested = investments.reduce((sum, asset) => sum + asset.investedValue, 0);
        const current = investments.reduce((sum, asset) => sum + asset.currentValue, 0);
        return {
          ...category,
          transactionCount: transactions.length,
          investmentCount: detailedInvestments.length || investments.length,
          spent,
          invested,
          current,
        };
      }),
    [data.categories, data.investments, data.transactions],
  );
  const generalUsage = usage.filter((category) => !isFiiCategoryName(category.name));
  const fiiUsage = usage.filter((category) => isFiiCategoryName(category.name));

  function save(category: Category) {
    if (data.categories.some((item) => item.id === category.id)) updateCategory(category);
    else {
      const { id: _id, ...payload } = category;
      addCategory(payload);
    }
    setEditing(null);
  }

  return (
    <Page title="Categorias" action={<button className="primary-button" type="button" onClick={() => setEditing(createEmptyCategory())}><Plus size={17} />Nova categoria</button>}>
      <Panel title="Categorias gerais">
        <CategoryUsageRows categories={generalUsage} onEdit={setEditing} onDelete={deleteCategory} />
      </Panel>
      <Panel title="Categorias de FIIs" action={<Pill color="#a78bfa">separadas da carteira geral</Pill>}>
        <div className="inline-alert">Estas categorias servem para aportes e proventos. As posições dos FIIs são organizadas por ticker na área exclusiva de FIIs.</div>
        <CategoryUsageRows categories={fiiUsage} onEdit={setEditing} onDelete={deleteCategory} />
      </Panel>
      <Modal title={editing?.id ? "Editar categoria" : "Nova categoria"} open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? <CategoryForm category={editing} onSave={save} /> : null}
      </Modal>
    </Page>
  );
}

function CategoryUsageRows({ categories, onEdit, onDelete }: {
  categories: Array<Category & { transactionCount: number; investmentCount: number; spent: number; invested: number; current: number }>;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
}) {
  if (!categories.length) return <EmptyState title="Nenhuma categoria nesta seção" text="As categorias aparecerão aqui quando forem criadas ou importadas." />;
  return (
    <div className="category-list">
      {categories.map((category) => (
          <article className="category-list-row" key={category.id}>
            <div className="category-main">
              <Pill color={category.color}><CategoryIcon name={category.icon} /></Pill>
              <div>
                <strong>{category.name}</strong>
                <span>{categoryTypeLabel(category.type)} · {formatCategoryUsage(category.transactionCount, category.investmentCount)}</span>
              </div>
            </div>
            <div className="category-metric">
              <span>Gasto</span>
              <strong>{formatCurrency(category.spent)}</strong>
            </div>
            <div className="category-metric">
              <span>Investido</span>
              <strong>{category.investmentCount ? formatCurrency(category.invested) : "Sem ativos"}</strong>
            </div>
            <div className="category-metric">
              <span>Atual</span>
              <strong className={category.current >= category.invested ? "amount-positive" : "amount-negative"}>{category.investmentCount ? formatCurrency(category.current) : category.monthlyBudget ? formatCurrency(category.monthlyBudget) : "Sem limite"}</strong>
            </div>
            <div className="category-progress" aria-hidden="true">
              <span style={{ width: `${category.investmentCount && category.invested ? Math.min((category.current / category.invested) * 100, 100) : category.monthlyBudget ? Math.min((category.spent / category.monthlyBudget) * 100, 100) : 0}%`, background: category.color }} />
            </div>
            <div className="row-actions">
              <button className="icon-button" type="button" onClick={() => onEdit(category)} aria-label={`Editar ${category.name}`}><Edit3 size={16} /></button>
              <button
                className="icon-button danger-icon"
                type="button"
                aria-label={`Excluir ${category.name}`}
                onClick={() => {
                  const inUse = category.transactionCount + category.investmentCount;
                  const message = inUse ? "Categoria em uso. Transações e investimentos serão realocados para Sem categoria, preservando os valores. Continuar?" : "Excluir categoria?";
                  if (window.confirm(message)) onDelete(category.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
    </div>
  );
}

function InvestmentsPage() {
  const { data, addInvestment, updateInvestment, updateInvestmentCategorySummaries, deleteInvestment, addCategory, updateCategory, deleteCategory } = useRequiredData();
  const [section, setSection] = useState<"investments" | "fiis">("investments");
  const [investmentTab, setInvestmentTab] = useState<"summary" | "update" | "details" | "categories">("summary");
  const [fiiTab, setFiiTab] = useState<"portfolio" | "update" | "income">("portfolio");
  const [editing, setEditing] = useState<InvestmentAsset | null>(null);
  const [categoryEditing, setCategoryEditing] = useState<Category | null>(null);
  const nonFiiInvestments = getNonFiiInvestments(data.investments);
  const fiiInvestments = getFiiInvestments(data.investments);
  const portfolioAssets = getPortfolioInvestments(nonFiiInvestments);
  const detailedAssets = getDetailedInvestments(nonFiiInvestments);
  const fiiPortfolioAssets = getPortfolioInvestments(fiiInvestments);
  const fiiAssets = getDetailedInvestments(fiiInvestments);
  const fiiValueAssets = fiiAssets.length ? fiiAssets : fiiPortfolioAssets;
  const allocation = getInvestmentAllocation(nonFiiInvestments, "category");
  const portfolioCategoryKeys = new Set(portfolioAssets.map((asset) => normalizeCategoryName(asset.category)));
  const investmentCategories = data.categories.filter(
    (category) => !isFiiCategoryName(category.name)
      && (category.type === "investment" || portfolioCategoryKeys.has(normalizeCategoryName(category.name))),
  );
  const portfolio = getPortfolioEvolution(nonFiiInvestments, []);
  const investedValue = portfolioAssets.reduce((total, asset) => total + asset.investedValue, 0);
  const currentValue = portfolioAssets.reduce((total, asset) => total + asset.currentValue, 0);
  const investmentResult = currentValue - investedValue;
  const fiiInvestedValue = fiiValueAssets.reduce((total, asset) => total + asset.investedValue, 0);
  const fiiCurrentValue = fiiValueAssets.reduce((total, asset) => total + asset.currentValue, 0);
  const fiiAssetIds = new Set(fiiAssets.map((asset) => asset.id));
  const fiiDividends = fiiAssets.reduce((total, asset) => {
    const linked = data.dividends.filter((dividend) => dividend.assetId === asset.id).reduce((sum, dividend) => sum + dividend.amount, 0);
    return total + (linked || asset.dividends);
  }, 0);
  const fiiResult = fiiCurrentValue + fiiDividends - fiiInvestedValue;
  const fiiIncomeRows = data.dividends
    .filter((dividend) => fiiAssetIds.has(dividend.assetId))
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  function save(asset: InvestmentAsset) {
    const detailedAsset = { ...asset, trackingMode: "maturity_detail" as const };
    if (data.investments.some((item) => item.id === asset.id)) updateInvestment(detailedAsset);
    else {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = detailedAsset;
      addInvestment(payload);
    }
    setEditing(null);
  }

  function saveInvestmentCategory(category: Category) {
    const normalized = { ...category, type: "investment" as const };
    if (data.categories.some((item) => item.id === category.id)) updateCategory(normalized);
    else {
      const { id: _id, ...payload } = normalized;
      addCategory(payload);
    }
    setCategoryEditing(null);
  }

  function startNewInvestment(assetType?: "fii") {
    const empty = createEmptyInvestment();
    setEditing(assetType === "fii"
      ? { ...empty, assetType: "fii", category: FII_CATEGORY_NAME, quantity: 1 }
      : empty);
  }

  return (
    <Page
      title="Investimentos"
      action={(
        <button className="primary-button" type="button" onClick={() => startNewInvestment(section === "fiis" ? "fii" : undefined)}>
          <Plus size={17} />{section === "fiis" ? "Novo FII" : "Novo investimento"}
        </button>
      )}
    >
      <div className="investment-section-switch" role="tablist" aria-label="Área de investimentos">
        <button className={section === "investments" ? "active" : ""} type="button" role="tab" aria-selected={section === "investments"} onClick={() => setSection("investments")}>
          <Landmark size={20} />
          <span><strong>Investimentos</strong><small>CDBs, renda fixa e outros</small></span>
        </button>
        <button className={section === "fiis" ? "active fii-active" : ""} type="button" role="tab" aria-selected={section === "fiis"} onClick={() => setSection("fiis")}>
          <Building2 size={20} />
          <span><strong>FIIs</strong><small>Cotas, posições e proventos</small></span>
        </button>
      </div>

      {section === "investments" ? (
        <>
          <div className="stats-grid compact investment-stats">
            <StatCard icon={Landmark} label="Total aplicado" value={formatCurrency(investedValue)} tone="blue" />
            <StatCard icon={BadgeDollarSign} label="Valor acumulado" value={formatCurrency(currentValue)} tone="green" />
            <StatCard icon={TrendingIcon} label="Rendimento" value={formatCurrency(investmentResult)} tone={investmentResult >= 0 ? "green" : "red"} />
          </div>
          <div className="investment-subnav">
            <Segmented value={investmentTab} onChange={(value) => setInvestmentTab(value as typeof investmentTab)} items={[["summary", "Resumo"], ["update", "Atualizar"], ["details", "Aplicações"], ["categories", "Categorias"]]} />
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid compact investment-stats fii-stats">
            <StatCard icon={Building2} label="Posição atual" value={formatCurrency(fiiCurrentValue)} tone="purple" />
            <StatCard icon={BadgeDollarSign} label="Proventos" value={formatCurrency(fiiDividends)} tone="green" />
            <StatCard icon={TrendingIcon} label="Retorno total" value={formatCurrency(fiiResult)} tone={fiiResult >= 0 ? "green" : "red"} />
          </div>
          <div className="investment-subnav fii-subnav">
            <Segmented value={fiiTab} onChange={(value) => setFiiTab(value as typeof fiiTab)} items={[["portfolio", "Carteira"], ["update", "Atualizar"], ["income", "Proventos"]]} />
          </div>
        </>
      )}

      {section === "investments" && investmentTab === "summary" ? (
        <div className="two-column">
          <Panel title="Valores acumulados por categoria" action={<Pill>{portfolioAssets.length} categoria(s)</Pill>}>
            <InvestmentCategoryOverview assets={portfolioAssets} />
          </Panel>
          <Panel title="Distribuição dos investimentos">
            {allocation.length ? <PieChartBlock data={allocation} /> : <EmptyState title="Sem categorias atualizadas" text="Use Atualizar investimentos para informar os totais da carteira." />}
          </Panel>
          <div className="dashboard-wide">
          <Panel title="Comparação do valor aplicado e atual" mobileDefaultCollapsed>
            <ChartBox>
              <ResponsiveContainer>
                <LineChart data={portfolio} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line dataKey="value" stroke="#5eead4" strokeWidth={3} name="Valor" dot={{ r: 5, fill: "#38bdf8" }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
          </div>
        </div>
      ) : null}

      {section === "investments" && investmentTab === "update" ? (
        <div className="two-column">
          <div className="dashboard-wide">
            <Panel title="Atualizar outros investimentos por print" action={<Pill color="#38bdf8">CDBs, renda fixa e fundos</Pill>}>
              <InvestmentScreenshotUpdater assets={nonFiiInvestments} onSaveCategories={updateInvestmentCategorySummaries} />
            </Panel>
          </div>
          <Panel title="Conferência dos valores acumulados" action={<Pill>{portfolioAssets.length} categoria(s)</Pill>}>
            <InvestmentCategoryOverview assets={portfolioAssets} />
          </Panel>
          <Panel title="Ajuste manual por categoria" action={<Pill>{portfolioAssets.length} categoria(s)</Pill>}>
            {portfolioAssets.length
              ? <InvestmentCategoryQuickUpdate assets={portfolioAssets} onSaveCategory={(summary) => updateInvestmentCategorySummaries([summary])} />
              : <EmptyState title="Nenhuma categoria consolidada" text="Envie um print para iniciar a visão geral acumulada." />}
          </Panel>
        </div>
      ) : null}

      {section === "investments" && investmentTab === "details" ? (
        <div className="two-column">
          <Panel title="Aplicações detalhadas" action={<Pill>{detailedAssets.length} aplicação(ões)</Pill>}>
            <div className="inline-alert">Estes cadastros servem para acompanhar vencimentos e renovações. Seus valores não são somados novamente ao patrimônio.</div>
            <InvestmentTable assets={detailedAssets} onEdit={setEditing} onDelete={deleteInvestment} />
          </Panel>
          <Panel title="Agenda de vencimentos">
            <InvestmentMaturityAgenda assets={detailedAssets} />
          </Panel>
        </div>
      ) : null}

      {section === "investments" && investmentTab === "categories" ? (
        <Panel
          title="Categorias dos outros investimentos"
          action={<button className="primary-button" type="button" onClick={() => setCategoryEditing(createEmptyCategory("investment"))}><Plus size={17} />Nova categoria</button>}
        >
          <div className="inline-alert">FIIs não aparecem aqui: eles são organizados separadamente por ticker.</div>
          <CategoryAdminList
            categories={investmentCategories}
            onEdit={setCategoryEditing}
            onDelete={(category) => {
              const inUse = data.investments.some((asset) => !isFiiInvestment(asset) && sameCategory(asset.category, category.name));
              const message = inUse ? "Categoria em uso. Os investimentos serão movidos para Sem categoria, preservando os totais. Continuar?" : "Excluir esta categoria?";
              if (window.confirm(message)) deleteCategory(category.id);
            }}
          />
        </Panel>
      ) : null}

      {section === "fiis" && fiiTab === "portfolio" ? (
        <div className="two-column">
          <div className="dashboard-wide">
            <Panel title="Posições acumuladas por FII" action={<Pill color="#a78bfa">{fiiAssets.length} posição(ões)</Pill>}>
              <InvestmentFiiOverview assets={fiiAssets} dividends={data.dividends} />
            </Panel>
          </div>
          <Panel title="Como o total é formado">
            <div className="stack-list compact-summary-list">
              <div className="list-row"><span>Valor aplicado</span><strong>{formatCurrency(fiiInvestedValue)}</strong></div>
              <div className="list-row"><span>Valor atual das cotas</span><strong>{formatCurrency(fiiCurrentValue)}</strong></div>
              <div className="list-row"><span>Proventos recebidos</span><strong className="amount-positive">+{formatCurrency(fiiDividends)}</strong></div>
              <div className="list-row"><span>Retorno total</span><strong className={fiiResult >= 0 ? "amount-positive" : "amount-negative"}>{fiiResult >= 0 ? "+" : ""}{formatCurrency(fiiResult)}</strong></div>
            </div>
          </Panel>
          <Panel title="Proventos recentes" mobileDefaultCollapsed>
            <ChartBox>
              <ResponsiveContainer>
                <BarChart data={getDividendsByMonth(data.dividends)} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${Number(value)}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#a78bfa" name="Proventos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
          <div className="dashboard-wide">
            <Panel title="Gerenciar posições de FIIs" mobileDefaultCollapsed action={<Pill>{fiiAssets.length} cadastro(s)</Pill>}>
              <InvestmentTable assets={fiiAssets} onEdit={(asset) => setEditing({ ...asset, assetType: "fii", category: FII_CATEGORY_NAME })} onDelete={deleteInvestment} />
            </Panel>
          </div>
        </div>
      ) : null}

      {section === "fiis" && fiiTab === "update" ? (
        <div className="two-column">
          <div className="dashboard-wide">
            <Panel title="Atualizar FIIs por print" action={<Pill color="#a78bfa">ticker, cotas e preços</Pill>}>
              <FiiScreenshotUpdater assets={fiiAssets} onUpdate={updateInvestment} />
            </Panel>
          </div>
          <Panel title="Conferência da carteira" action={<Pill>{fiiAssets.length} FII(s)</Pill>}>
            <InvestmentFiiOverview assets={fiiAssets} dividends={data.dividends} />
          </Panel>
          <Panel title="Ajuste manual das cotas">
            {fiiAssets.length ? <FiiQuickUpdate assets={fiiAssets} onUpdate={updateInvestment} /> : <EmptyState title="Nenhum FII cadastrado" text="Cadastre um FII antes de atualizar a carteira por print." />}
          </Panel>
        </div>
      ) : null}

      {section === "fiis" && fiiTab === "income" ? (
        <div className="two-column">
          <Panel title="Proventos por mês">
            <ChartBox>
              <ResponsiveContainer>
                <BarChart data={getDividendsByMonth(fiiIncomeRows)} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${Number(value)}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#a78bfa" name="Proventos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
          <Panel title="Recebimentos vinculados" action={<Pill>{fiiIncomeRows.length} lançamento(s)</Pill>}>
            {fiiIncomeRows.length ? (
              <div className="stack-list">
                {fiiIncomeRows.map((income) => {
                  const asset = fiiAssets.find((item) => item.id === income.assetId);
                  return <div className="list-row" key={income.id}><div><strong>{normalizeTicker(asset?.ticker || "") || asset?.name || "FII"}</strong><span>{income.description} · {formatDate(income.date)}</span></div><strong className="amount-positive">+{formatCurrency(income.amount)}</strong></div>;
                })}
              </div>
            ) : <EmptyState title="Nenhum provento vinculado" text="Importe o extrato bancário em Transações e vincule as receitas aos respectivos FIIs." />}
          </Panel>
        </div>
      ) : null}
      <Modal title={editing && editing.id !== "new" ? (section === "fiis" ? "Editar FII" : "Editar investimento") : (section === "fiis" ? "Adicionar FII" : "Adicionar investimento")} open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? <InvestmentForm asset={editing} categories={data.categories} mode={section} onSave={save} /> : null}
      </Modal>
      <Modal title={categoryEditing?.id === "new" ? "Nova categoria de investimento" : "Editar categoria de investimento"} open={Boolean(categoryEditing)} onClose={() => setCategoryEditing(null)}>
        {categoryEditing ? <CategoryForm key={categoryEditing.id} category={categoryEditing} onSave={saveInvestmentCategory} lockType="investment" /> : null}
      </Modal>
    </Page>
  );
}

function GuruPage() {
  const { data, appendChat, replaceInsights, addGoal, updateGoal, deleteGoal } = useRequiredData();
  const [tab, setTab] = useState<"chat" | "analise" | "insights" | "metas">("chat");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [goalEditing, setGoalEditing] = useState<Goal | null>(null);
  const summary = calculateDashboard(data);

  async function sendQuestion(event: FormEvent) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setQuestion("");
    appendChat("user", trimmed);
    setLoading(true);
    const answer = await aiService.chat(trimmed, data);
    appendChat("assistant", answer.content);
    setLoading(false);
  }

  async function generateInsights() {
    setLoading(true);
    const insights = await aiService.generateInsight(data);
    replaceInsights(insights);
    setLoading(false);
  }

  return (
    <Page title="Guru Financeiro" subtitle="Assistente educacional baseado nos seus dados cadastrados">
      <Segmented value={tab} onChange={(value) => setTab(value as typeof tab)} items={[["chat", "Chat"], ["analise", "Análise"], ["insights", "Insights"], ["metas", "Metas"]]} />
      {tab === "chat" ? (
        <Panel title={data.settings.aiAssistantName} action={<Pill color="#2563eb">educacional</Pill>}>
          <div className="chat-window">
            {data.chat.map((message) => (
              <div className={`chat-bubble ${message.role}`} key={message.id}>
                <span>{message.role === "assistant" ? data.settings.aiAssistantName : "Você"}</span>
                <p>{message.content}</p>
              </div>
            ))}
            {loading ? <div className="chat-bubble assistant"><Loader2 className="spin" size={16} /><p>Analisando seus dados...</p></div> : null}
          </div>
          <div className="quick-prompts">
            {["Resuma meu mês", "Onde estou gastando mais?", "Analise meus FIIs", "Como aumentar meu patrimônio?"].map((prompt) => (
              <button className="chip-button" type="button" key={prompt} onClick={() => setQuestion(prompt)}>{prompt}</button>
            ))}
          </div>
          <form className="chat-form" onSubmit={sendQuestion}>
            <input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pergunte ao Guru..." />
            <button className="primary-button" type="submit" disabled={loading}><Sparkles size={17} />Enviar</button>
          </form>
          <p className="disclaimer">As respostas são educacionais e não constituem recomendação financeira profissional.</p>
        </Panel>
      ) : null}
      {tab === "analise" ? (
        <div className="dashboard-grid">
          <StatCard icon={Landmark} label="Patrimônio" value={formatCurrency(summary.current)} tone="green" />
          <StatCard icon={ReceiptText} label="Despesas do mês" value={formatCurrency(summary.expenses)} tone="red" />
          <StatCard icon={BadgeDollarSign} label="Proventos" value={formatCurrency(summary.dividends)} tone="purple" />
          <StatCard icon={ListChecks} label="Metas ativas" value={`${data.goals.filter((goal) => goal.status === "active").length}`} tone="blue" />
          <Panel title="Receitas vs despesas">
            <ChartBox>
              <ResponsiveContainer>
                <BarChart data={getMonthlyCashflow(data.transactions, 6)} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="receitas" fill="#14b8a6" />
                  <Bar dataKey="despesas" fill="#fb7185" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
          <Panel title="Outros investimentos">
            <PieChartBlock data={getInvestmentAllocation(getNonFiiInvestments(data.investments), "category")} />
          </Panel>
        </div>
      ) : null}
      {tab === "insights" ? (
        <Panel title="Insights em tempo real" action={<button className="primary-button" type="button" onClick={generateInsights} disabled={loading}><Sparkles size={17} />Gerar análise</button>}>
          <div className="insight-list">
            {data.insights.map((insight) => (
              <div className={`insight insight-${insight.severity}`} key={insight.id}>
                <Sparkles size={18} />
                <div>
                  <strong>{insight.title}</strong>
                  <p>{insight.message}</p>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ) : null}
      {tab === "metas" ? (
        <Panel title="Metas financeiras" action={<button className="primary-button" type="button" onClick={() => setGoalEditing(createEmptyGoal())}><Plus size={17} />Nova meta</button>}>
          <div className="goal-grid">
            {data.goals.map((goal) => (
              <article className="goal-card" key={goal.id}>
                <div>
                  <h3>{goal.name}</h3>
                  <span>{formatDate(goal.dueDate)} · {goal.status}</span>
                </div>
                <strong>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</strong>
                <div className="progress"><span style={{ width: `${calculateGoalProgress(goal) * 100}%` }} /></div>
                <div className="row-actions">
                  <button className="secondary-button" type="button" onClick={() => setGoalEditing(goal)}><Edit3 size={16} />Editar</button>
                  <button className="ghost-button" type="button" onClick={() => deleteGoal(goal.id)}><Trash2 size={16} />Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ) : null}
      <Modal title={goalEditing?.id ? "Editar meta" : "Nova meta"} open={Boolean(goalEditing)} onClose={() => setGoalEditing(null)}>
        {goalEditing ? (
          <GoalForm
            goal={goalEditing}
            categories={data.categories}
            onSave={(goal) => {
              if (data.goals.some((item) => item.id === goal.id)) updateGoal(goal);
              else {
                const { id: _id, createdAt: _createdAt, ...payload } = goal;
                addGoal(payload);
              }
              setGoalEditing(null);
            }}
          />
        ) : null}
      </Modal>
    </Page>
  );
}

function ReportsPage() {
  const { data } = useRequiredData();
  const cashflow = getMonthlyCashflow(data.transactions, 12);
  const categories = groupExpensesByCategory(data.transactions, data.categories);
  const dividends = getDividendsByMonth(data.dividends);
  const nonFiiInvestments = getNonFiiInvestments(data.investments);

  return (
    <Page title="Relatórios visuais" action={<button className="secondary-button" type="button" onClick={() => window.print()}><Download size={17} />Preparar PDF</button>}>
      <div className="dashboard-grid">
        <Panel title="Relatório mensal">
          <ChartBox>
            <ResponsiveContainer>
              <AreaChart data={cashflow} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Area dataKey="receitas" fill="#0f766e55" stroke="#5eead4" name="Receitas" />
                <Area dataKey="despesas" fill="#fb718555" stroke="#fb7185" name="Despesas" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
        <Panel title="Relatório por categoria">{categories.length ? <PieChartBlock data={categories.map((item) => ({ name: item.name, value: item.value }))} /> : <EmptyState title="Sem categorias com gasto" text="Cadastre ou importe transações para gerar este relatório." />}</Panel>
        <Panel title="Outros investimentos por categoria">{getPortfolioInvestments(nonFiiInvestments).length ? <PieChartBlock data={getInvestmentAllocation(nonFiiInvestments, "category")} /> : <EmptyState title="Sem outros investimentos" text="Atualize CDBs, renda fixa e outros ativos para acompanhar o patrimônio." />}</Panel>
        <Panel title="FIIs e dividendos">
          <ChartBox>
            <ResponsiveContainer>
              <BarChart data={dividends} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="value" fill="#a78bfa" name="Proventos" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
      </div>
      <Panel title="Leitura do relatório">
        <p className="report-copy">
          O relatório mostra receitas, despesas, patrimônio e proventos com base apenas nos dados cadastrados ou importados.
          Para manter a análise confiável, atualize cotações de FIIs e revise transações importadas antes de confirmar.
        </p>
      </Panel>
    </Page>
  );
}

function SettingsPage() {
  const { user, data, updateProfile, updateSettings, exportJson, importJson, supabaseReady, syncStatus, syncToSupabase, loadFromSupabase } = useRequiredData();
  const [name, setName] = useState(user.name);
  const [assistant, setAssistant] = useState(data.settings.aiAssistantName);

  function downloadJson() {
    const blob = new Blob([exportJson()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cofrinho-backup.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    importJson(await file.text());
  }

  return (
    <Page title="Configurações" subtitle="Perfil, preferências, backups e integrações">
      <div className="settings-grid">
        <Panel title="Perfil">
          <div className="form-grid">
            <label>Nome<input value={name} onChange={(event) => setName(event.target.value)} /></label>
            <button className="primary-button" type="button" onClick={() => updateProfile(name)}><CheckCircle2 size={17} />Salvar perfil</button>
          </div>
        </Panel>
        <Panel title="Preferências">
          <div className="form-grid">
            <label>Tema
              <select value={data.settings.theme} onChange={(event) => updateSettings({ theme: event.target.value as "light" | "dark" })}>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </label>
            <label>Período padrão
              <select value={data.settings.dashboardPeriod} onChange={(event) => updateSettings({ dashboardPeriod: event.target.value as "month" | "quarter" | "year" })}>
                <option value="month">Mês</option>
                <option value="quarter">Trimestre</option>
                <option value="year">Ano</option>
              </select>
            </label>
            <label className="check-row"><input type="checkbox" checked={data.settings.notifications} onChange={(event) => updateSettings({ notifications: event.target.checked })} /> Notificações e alertas</label>
          </div>
        </Panel>
        <Panel title="Backup e restauração">
          <div className="button-stack">
            <button className="secondary-button" type="button" onClick={downloadJson}><Download size={17} />Exportar JSON</button>
            <label className="file-button"><Upload size={17} />Importar JSON ou migração<input type="file" accept="application/json,.json" onChange={handleImport} /></label>
          </div>
        </Panel>
        <Panel title="IA e segurança">
          <div className="form-grid">
            <label>Nome do assistente<input value={assistant} onChange={(event) => setAssistant(event.target.value)} /></label>
            <button className="primary-button" type="button" onClick={() => updateSettings({ aiAssistantName: assistant })}><Bot size={17} />Salvar IA</button>
            <div className="inline-alert">
              O app não expõe chave de IA no front-end. Use VITE_AI_ENDPOINT apontando para um backend seguro ou Supabase Edge Function.
            </div>
          </div>
        </Panel>
        <Panel title="Supabase">
          <div className="stack-list">
            <div className="list-row"><span>Status</span><strong>{supabaseReady ? "Configurado" : "Aguardando variáveis"}</strong></div>
            <div className="list-row"><span>Sincronização</span><strong>{syncStatus}</strong></div>
          </div>
          <div className="button-stack">
            <button className="secondary-button" type="button" onClick={syncToSupabase} disabled={!supabaseReady}><Upload size={17} />Enviar dados</button>
            <button className="secondary-button" type="button" onClick={loadFromSupabase} disabled={!supabaseReady}><Download size={17} />Baixar dados</button>
          </div>
        </Panel>
        <Panel title="Investimentos">
          <div className="form-grid">
            <label>Corretora padrão<input value={data.settings.defaultBroker ?? ""} onChange={(event) => updateSettings({ defaultBroker: event.target.value })} placeholder="C6, XP, BTG..." /></label>
            <label>Atualização de cotações
              <select value={data.settings.quoteRefreshMode} onChange={(event) => updateSettings({ quoteRefreshMode: event.target.value as "manual" | "daily" | "weekly" })}>
                <option value="manual">Manual</option>
                <option value="daily">Diária</option>
                <option value="weekly">Semanal</option>
              </select>
            </label>
          </div>
        </Panel>
      </div>
    </Page>
  );
}

function TransactionForm({ transaction, data, onSave }: { transaction: Transaction; data: ReturnType<typeof useRequiredData>["data"]; onSave: (transaction: Transaction) => void }) {
  const [draft, setDraft] = useState<Transaction>(transaction);
  const typeOptions: Array<{ id: TransactionType; label: string; icon: React.ComponentType<{ size?: number }> }> = [
    { id: "income", label: "Receita", icon: ArrowDownLeft },
    { id: "expense", label: "Despesa", icon: ArrowUpRight },
    { id: "credit", label: "Crédito", icon: CreditCard },
    { id: "transfer", label: "Transferência", icon: ArrowLeftRight },
    { id: "investment", label: "Aporte", icon: Landmark },
  ];
  const categories = data.categories.filter((category) => {
    if (draft.type === "income" || draft.type === "credit") return category.type === "income" || category.type === "credit" || category.type === "both";
    if (draft.type === "expense") return category.type === "expense" || category.type === "both";
    if (draft.type === "investment") return category.type === "investment" || category.type === "both";
    return false;
  });
  const visibleCategories = categories.length ? categories : data.categories;
  const showPayment = draft.type === "expense" || draft.type === "credit";
  const showRecurring = draft.type !== "transfer" && draft.type !== "investment";
  const fiiAssets = data.investments.filter((asset) => asset.assetType === "fii" && asset.trackingMode !== "category_summary");
  const isFiiDividend = draft.type === "income" && draft.investmentIncomeType === "fii_dividend";

  function updateType(type: TransactionType) {
    const nextCategories = data.categories.filter((category) => {
      if (type === "income" || type === "credit") return category.type === "income" || category.type === "credit" || category.type === "both";
      if (type === "expense") return category.type === "expense" || category.type === "both";
      if (type === "investment") return category.type === "investment" || category.type === "both";
      return false;
    });
    setDraft((current) => ({
      ...current,
      type,
      categoryId: nextCategories.some((category) => category.id === current.categoryId) ? current.categoryId : nextCategories[0]?.id ?? current.categoryId,
      destinationAccountId: type === "transfer" ? current.destinationAccountId ?? data.accounts.find((account) => account.id !== current.accountId)?.id : undefined,
      paymentMethod: type === "expense" || type === "credit" ? current.paymentMethod || "Cartão" : "Manual",
      installment: type === "expense" || type === "credit" ? current.installment : undefined,
      investmentIncomeType: type === "income" ? current.investmentIncomeType : undefined,
      investmentAssetId: type === "income" ? current.investmentAssetId : undefined,
    }));
  }

  return (
    <form className="form-grid smart-form" onSubmit={(event) => {
      event.preventDefault();
      onSave({
        ...draft,
        amount: Math.max(0, Number(draft.amount)),
        recurring: showRecurring ? draft.recurring : false,
        installment: showPayment ? draft.installment : undefined,
        investmentIncomeType: isFiiDividend ? "fii_dividend" : undefined,
        investmentAssetId: isFiiDividend ? draft.investmentAssetId : undefined,
      });
    }}>
      <div className="form-section span-2">
        <div className="form-section-title"><strong>Tipo do lançamento</strong><span>Mostramos somente os campos necessários.</span></div>
        <div className="type-picker transaction-type-picker">
          {typeOptions.map(({ id, label, icon: Icon }) => (
            <button data-testid={`transaction-type-${id}`} className={draft.type === id ? "active" : ""} type="button" key={id} onClick={() => updateType(id)}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </div>
      </div>
      <label className="amount-input span-2">Valor (R$)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.amount || ""} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} placeholder="0,00" required /></label>
      <label>Data<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></label>
      <label>Status
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TransactionStatus })}>
          <option value="paid">{draft.type === "income" || draft.type === "credit" ? "Recebido" : "Pago"}</option>
          <option value="pending">Pendente</option>
          <option value="planned">Planejado</option>
        </select>
      </label>
      <label className="span-2">Descrição<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} placeholder={draft.type === "income" ? "Ex: Salário de julho" : draft.type === "investment" ? "Ex: Aporte mensal" : "Ex: Supermercado"} required /></label>
      {draft.type !== "transfer" ? (
        <label>Categoria
          <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
            {visibleCategories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
        </label>
      ) : null}
      <label>{draft.type === "transfer" ? "Conta de origem" : "Conta"}
        <select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}>
          {data.accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
        </select>
      </label>
      {draft.type === "transfer" ? (
        <label className="span-2">Conta de destino
          <select value={draft.destinationAccountId ?? ""} onChange={(event) => setDraft({ ...draft, destinationAccountId: event.target.value })} required>
            <option value="">Selecione</option>
            {data.accounts.filter((account) => account.id !== draft.accountId).map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
          </select>
        </label>
      ) : (
        <label>{draft.type === "expense" ? "Estabelecimento" : draft.type === "income" || draft.type === "credit" ? "Origem do dinheiro" : "Instituição / destino"}
          <input value={draft.counterparty ?? ""} onChange={(event) => setDraft({ ...draft, counterparty: event.target.value })} placeholder={draft.type === "expense" ? "Ex: Mercado, farmácia" : "Opcional"} />
        </label>
      )}
      {draft.type === "income" ? (
        <>
          <label className="check-row switch-row span-2">
            <input
              type="checkbox"
              checked={isFiiDividend}
              disabled={!fiiAssets.length}
              onChange={(event) => {
                const dividendCategory = data.categories.find((category) => normalizeCategoryName(category.name) === "dividendos");
                setDraft({
                  ...draft,
                  investmentIncomeType: event.target.checked ? "fii_dividend" : undefined,
                  investmentAssetId: event.target.checked ? draft.investmentAssetId || fiiAssets[0]?.id : undefined,
                  categoryId: event.target.checked && dividendCategory ? dividendCategory.id : draft.categoryId,
                  paymentMethod: event.target.checked ? "Provento de FII" : draft.paymentMethod,
                });
              }}
            />
            <span><strong>Esta receita é rendimento de FII</strong><small>O valor recebido também entrará no painel de proventos.</small></span>
          </label>
          {isFiiDividend ? (
            <label className="span-2">FII que pagou o rendimento
              <select value={draft.investmentAssetId ?? ""} onChange={(event) => setDraft({ ...draft, investmentAssetId: event.target.value })} required>
                <option value="">Selecione o FII</option>
                {fiiAssets.map((asset) => <option value={asset.id} key={asset.id}>{normalizeTicker(asset.ticker) || asset.name} · {asset.name}</option>)}
              </select>
            </label>
          ) : !fiiAssets.length ? <span className="muted-inline span-2">Cadastre um FII em Investimentos detalhados para vincular rendimentos.</span> : null}
        </>
      ) : null}
      {showPayment ? (
        <>
          <label>Forma de pagamento
            <select value={draft.paymentMethod} onChange={(event) => setDraft({ ...draft, paymentMethod: event.target.value })}>
              <option>Cartão de crédito</option><option>Cartão de débito</option><option>PIX</option><option>Dinheiro</option><option>Boleto</option><option>Débito automático</option><option>Outro</option>
            </select>
          </label>
          <label>Vencimento<input type="date" value={draft.dueDate ?? ""} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value || undefined })} /></label>
          <label>Parcelas
            <select value={draft.installment?.total ?? 1} onChange={(event) => { const total = Number(event.target.value); setDraft({ ...draft, installment: total > 1 ? { current: 1, total } : undefined }); }}>
              {Array.from({ length: 24 }, (_, index) => index + 1).map((total) => <option value={total} key={total}>{total === 1 ? "À vista" : `${total}x`}</option>)}
            </select>
          </label>
        </>
      ) : null}
      {showRecurring ? <label className="check-row switch-row span-2"><input type="checkbox" checked={Boolean(draft.recurring)} onChange={(event) => setDraft({ ...draft, recurring: event.target.checked })} /><span><strong>Lançamento recorrente</strong><small>Repete nos próximos meses.</small></span></label> : null}
      <label className="span-2">Tags<input value={draft.tags.join(", ")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="Ex: casa, trabalho, mensal" /></label>
      <label className="span-2">Observações<textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Informações adicionais" /></label>
      <button className="primary-button span-2 form-submit" type="submit"><CheckCircle2 size={18} />Salvar {draft.type === "income" ? "receita" : draft.type === "expense" ? "despesa" : "lançamento"}</button>
    </form>
  );
}

function TransactionMobileList({
  transactions,
  investments,
  categoryMap,
  selected,
  onToggle,
  onEdit,
  onDelete,
}: {
  transactions: Transaction[];
  investments: InvestmentAsset[];
  categoryMap: Map<string, Category>;
  selected: string[];
  onToggle: (id: string, checked: boolean) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="transaction-mobile-list">
      {transactions.map((transaction) => {
        const outgoing = transaction.type === "expense" || transaction.type === "investment";
        const Icon = transaction.type === "transfer" ? ArrowLeftRight : outgoing ? ArrowUpRight : ArrowDownLeft;
        const category = categoryMap.get(transaction.categoryId);
        return (
          <article className="transaction-mobile-card" key={transaction.id}>
            <label className="transaction-select" aria-label={`Selecionar ${transaction.description}`}>
              <input type="checkbox" checked={selected.includes(transaction.id)} onChange={(event) => onToggle(transaction.id, event.target.checked)} />
            </label>
            <div className={`transaction-type-icon transaction-type-${transaction.type}`}><Icon size={18} /></div>
            <div className="transaction-mobile-copy">
              <strong>{transaction.description || "Sem descrição"}</strong>
              <span>{formatDate(transaction.date)} · {category?.name ?? "Sem categoria"}</span>
              <small>{transactionFiiIncomeLabel(transaction, investments) || statusLabel(transaction.status)}{transaction.recurring ? " · Recorrente" : ""}</small>
            </div>
            <strong className={`transaction-mobile-amount ${outgoing ? "amount-negative" : transaction.type === "transfer" ? "" : "amount-positive"}`}>
              {outgoing ? "−" : transaction.type === "transfer" ? "" : "+"}{formatCurrency(transaction.amount)}
            </strong>
            <div className="row-actions transaction-mobile-actions">
              <button className="icon-button" type="button" aria-label={`Editar ${transaction.description}`} onClick={() => onEdit(transaction)}><Edit3 size={16} /></button>
              <button className="icon-button danger-icon" type="button" aria-label={`Excluir ${transaction.description}`} onClick={() => window.confirm("Excluir esta transação?") && onDelete(transaction.id)}><Trash2 size={16} /></button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ImportFlow({ data, onImport }: { data: ReturnType<typeof useRequiredData>["data"]; onImport: (items: ImportPreviewItem[], fileName: string, source: "csv" | "image") => void }) {
  const [preview, setPreview] = useState<ImportPreviewItem[]>([]);
  const [fileName, setFileName] = useState("");
  const [source, setSource] = useState<"csv" | "image">("csv");
  const [loading, setLoading] = useState(false);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setLoading(true);
    const first = files[0];
    setFileName(files.map((file) => file.name).join(", "));
    const isCsv = first.name.toLowerCase().endsWith(".csv");
    setSource(isCsv ? "csv" : "image");
    const items = isCsv ? await parseCsvFile(first, data) : await analyzeImageFiles(files, data);
    setPreview(items);
    setLoading(false);
  }

  function updateItem(id: string, patch: Partial<ImportPreviewItem>) {
    setPreview((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  const selectedCount = preview.filter((item) => item.selected && !item.duplicate).length;

  return (
    <div className="import-flow">
      <label className="upload-zone">
        <FileSpreadsheet size={32} />
        <strong>Selecionar CSV, imagem ou PDF do extrato</strong>
        <span>Use esta área para receitas, despesas, aportes e rendimentos que aparecem no extrato bancário.</span>
        <input type="file" accept=".csv,image/*,.pdf" multiple onChange={handleFiles} />
      </label>
      {loading ? <div className="inline-alert"><Loader2 className="spin" size={16} /> Analisando arquivo...</div> : null}
      {preview.length ? (
        <>
          <div className="bulk-bar">
            <span>{selectedCount} item(ns) prontos para importar · {preview.filter((item) => item.duplicate).length} duplicado(s)</span>
            <button className="primary-button" type="button" onClick={() => onImport(preview, fileName, source)} disabled={!selectedCount}>
              <CheckCircle2 size={17} />
              Confirmar importação
            </button>
          </div>
          <div className="import-preview-mobile">
            {preview.map((item) => (
              <article className={`import-preview-card ${item.duplicate ? "muted-row" : ""}`} key={item.id}>
                <div className="import-preview-head">
                  <label className="check-row"><input type="checkbox" checked={item.selected} disabled={item.duplicate} onChange={(event) => updateItem(item.id, { selected: event.target.checked })} /><strong>{item.duplicate ? "Duplicado" : "Importar"}</strong></label>
                  <Pill color={item.duplicate ? "#fb7185" : "#34d399"}>{item.duplicate ? "Ignorado" : "Novo"}</Pill>
                </div>
                <label className="span-2">Descrição<input value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></label>
                <label>Data<input type="date" value={item.date} onChange={(event) => updateItem(item.id, { date: event.target.value })} /></label>
                <label>Valor<input type="number" inputMode="decimal" step="0.01" value={item.amount} onChange={(event) => updateItem(item.id, { amount: Number(event.target.value) })} /></label>
                <label>Tipo
                  <select value={item.type} onChange={(event) => updateItem(item.id, { type: event.target.value as TransactionType })}>
                    <option value="income">Receita</option><option value="expense">Despesa</option><option value="investment">Investimento</option>
                  </select>
                </label>
                <label>Categoria
                  <select value={item.categoryId} onChange={(event) => updateItem(item.id, { categoryId: event.target.value })}>
                    {data.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                </label>
              </article>
            ))}
          </div>
          <div className="data-table-wrap import-preview-table">
            <table className="data-table">
              <thead>
                <tr>
                  <th />
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((item) => (
                  <tr key={item.id} className={item.duplicate ? "muted-row" : ""}>
                    <td><input type="checkbox" checked={item.selected} disabled={item.duplicate} onChange={(event) => updateItem(item.id, { selected: event.target.checked })} /></td>
                    <td><input type="date" value={item.date} onChange={(event) => updateItem(item.id, { date: event.target.value })} /></td>
                    <td><input value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} /></td>
                    <td>
                      <select value={item.type} onChange={(event) => updateItem(item.id, { type: event.target.value as TransactionType })}>
                        <option value="income">Entrada</option>
                        <option value="expense">Saída</option>
                        <option value="investment">Investimento</option>
                      </select>
                    </td>
                    <td>
                      <select value={item.categoryId} onChange={(event) => updateItem(item.id, { categoryId: event.target.value })}>
                        {data.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                      </select>
                    </td>
                    <td><input type="number" step="0.01" value={item.amount} onChange={(event) => updateItem(item.id, { amount: Number(event.target.value) })} /></td>
                    <td>{item.duplicate ? "Duplicado" : "Novo"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <EmptyState title="Nenhum extrato selecionado" text="CSV vira prévia editável. Prints e PDFs devem representar extratos de banco, não telas de carteira de investimentos." />
      )}
    </div>
  );
}

function CategoryForm({ category, onSave, lockType }: { category: Category; onSave: (category: Category) => void; lockType?: Category["type"] }) {
  const [draft, setDraft] = useState(category);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, type: lockType ?? draft.type }); }}>
      <label>Nome<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
      <label>Tipo
        <select value={lockType ?? draft.type} disabled={Boolean(lockType)} onChange={(event) => setDraft({ ...draft, type: event.target.value as Category["type"] })}>
          <option value="income">Receita</option>
          <option value="expense">Despesa</option>
          <option value="investment">Investimento</option>
          <option value="credit">Crédito</option>
          <option value="both">Ambos</option>
        </select>
      </label>
      <label>Cor<input type="color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} /></label>
      <label>Ícone<input value={draft.icon} onChange={(event) => setDraft({ ...draft, icon: event.target.value })} placeholder="Home, Wallet, FII..." /></label>
      <label>Limite mensal<input type="number" step="0.01" value={draft.monthlyBudget ?? ""} onChange={(event) => setDraft({ ...draft, monthlyBudget: Number(event.target.value) || undefined })} /></label>
      <button className="primary-button span-2" type="submit"><CheckCircle2 size={17} />Salvar categoria</button>
    </form>
  );
}

function CategoryAdminList({ categories, onEdit, onDelete }: { categories: Category[]; onEdit: (category: Category) => void; onDelete: (category: Category) => void }) {
  if (!categories.length) return <EmptyState title="Nenhuma categoria criada" text="Crie a primeira categoria para organizar seus lançamentos." />;
  return (
    <div className="category-admin-list">
      {categories.slice().sort((a, b) => a.name.localeCompare(b.name, "pt-BR")).map((category) => {
        const protectedCategory = category.id === "cat-sem-categoria";
        return (
          <article className="category-admin-row" key={category.id}>
            <div className="category-main">
              <Pill color={category.color}><CategoryIcon name={category.icon} /></Pill>
              <div><strong>{category.name}</strong><span>{categoryTypeLabel(category.type)}{category.monthlyBudget ? ` · limite ${formatCurrency(category.monthlyBudget)}` : ""}</span></div>
            </div>
            {protectedCategory ? <Pill color="#64748b">Padrão do sistema</Pill> : (
              <div className="row-actions">
                <button className="secondary-button" type="button" onClick={() => onEdit(category)}><Edit3 size={16} />Editar</button>
                <button className="icon-button danger-icon" type="button" onClick={() => onDelete(category)} aria-label={`Excluir ${category.name}`}><Trash2 size={16} /></button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

function InvestmentForm({ asset, categories, mode, onSave }: { asset: InvestmentAsset; categories: Category[]; mode: "investments" | "fiis"; onSave: (asset: InvestmentAsset) => void }) {
  const [draft, setDraft] = useState(asset);
  const marketAsset = draft.assetType === "fii" || draft.assetType === "stock" || draft.assetType === "crypto";
  const fixedAsset = draft.assetType === "fixed_income" || draft.assetType === "cdb" || draft.assetType === "lci_lca" || draft.assetType === "treasury";
  const fundAsset = draft.assetType === "fund";
  const unitBased = marketAsset || fundAsset;
  const quantity = Math.max(0, Number(draft.quantity));
  const calculatedInvested = quantity * Math.max(0, Number(draft.averagePrice));
  const calculatedCurrent = quantity * Math.max(0, Number(draft.currentPrice));
  const investedValue = Math.max(0, Number(draft.investedValue) || calculatedInvested);
  const currentValue = Math.max(0, Number(draft.currentValue) || calculatedCurrent || investedValue);
  const investmentCategories = categories.filter((category) => !isFiiCategoryName(category.name) && (category.type === "investment" || category.type === "both"));
  const categoryOptions = investmentCategories.length ? investmentCategories : categories;

  function updateType(assetType: AssetType) {
    const nextUnitBased = assetType === "fii" || assetType === "stock" || assetType === "crypto" || assetType === "fund";
    const nextFixed = assetType === "fixed_income" || assetType === "cdb" || assetType === "lci_lca" || assetType === "treasury";
    setDraft((current) => ({
      ...current,
      assetType,
      quantity: nextUnitBased ? Number(current.quantity) || 1 : 1,
      averagePrice: nextUnitBased ? Number(current.averagePrice) : Number(current.investedValue),
      currentPrice: nextUnitBased ? Number(current.currentPrice) : Number(current.currentValue),
      rateType: nextFixed ? current.rateType ?? (assetType === "treasury" ? "selic" : "cdi") : undefined,
      rateValue: nextFixed ? current.rateValue : undefined,
      hasFgc: assetType === "cdb" || assetType === "lci_lca" ? current.hasFgc ?? true : undefined,
    }));
  }

  function updateQuantity(nextQuantity: number) {
    const nextInvested = nextQuantity * Number(draft.averagePrice);
    const nextCurrent = nextQuantity * Number(draft.currentPrice) || nextInvested;
    setDraft({ ...draft, quantity: nextQuantity, investedValue: nextInvested, currentValue: nextCurrent });
  }

  function updateAveragePrice(averagePrice: number) {
    const nextInvested = Number(draft.quantity) * averagePrice;
    setDraft({ ...draft, averagePrice, investedValue: nextInvested, currentValue: Number(draft.currentValue) || nextInvested });
  }

  function updateCurrentPrice(currentPrice: number) {
    const nextCurrent = Number(draft.quantity) * currentPrice;
    setDraft({ ...draft, currentPrice, currentValue: nextCurrent });
  }

  function updateInvestedValue(nextInvested: number) {
    setDraft({ ...draft, investedValue: nextInvested, averagePrice: unitBased && quantity > 0 ? nextInvested / quantity : nextInvested, currentValue: Number(draft.currentValue) || nextInvested });
  }

  function updateCurrentValue(nextCurrent: number) {
    setDraft({ ...draft, currentValue: nextCurrent, currentPrice: unitBased && quantity > 0 ? nextCurrent / quantity : nextCurrent });
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const normalizedQuantity = unitBased ? Math.max(0, Number(draft.quantity)) : 1;
    const normalizedInvested = Math.max(0, investedValue);
    const normalizedCurrent = Math.max(0, currentValue || normalizedInvested);
    const keepsIncome = draft.assetType === "fii" || draft.assetType === "stock";
    onSave({
      ...draft,
      ticker: unitBased ? normalizeTicker(draft.ticker) || draft.name.trim() : draft.name.trim(),
      name: draft.name.trim(),
      quantity: normalizedQuantity,
      averagePrice: unitBased ? Math.max(0, Number(draft.averagePrice) || (normalizedQuantity ? normalizedInvested / normalizedQuantity : 0)) : normalizedInvested,
      currentPrice: unitBased ? Math.max(0, Number(draft.currentPrice) || (normalizedQuantity ? normalizedCurrent / normalizedQuantity : 0)) : normalizedCurrent,
      investedValue: normalizedInvested,
      currentValue: normalizedCurrent,
      dividends: keepsIncome ? Math.max(0, Number(draft.dividends)) : 0,
      dividendYield: keepsIncome ? Number(draft.dividendYield) || undefined : undefined,
      maturityDate: fixedAsset || draft.assetType === "other" ? draft.maturityDate || undefined : undefined,
      broker: draft.broker?.trim(),
      category: draft.assetType === "fii" ? FII_CATEGORY_NAME : draft.category?.trim() || undefined,
      rateType: fixedAsset ? draft.rateType : undefined,
      rateValue: fixedAsset ? Number(draft.rateValue) || undefined : undefined,
      liquidity: fixedAsset ? draft.liquidity?.trim() || undefined : undefined,
      hasFgc: draft.assetType === "cdb" || draft.assetType === "lci_lca" ? Boolean(draft.hasFgc) : undefined,
      cnpj: fundAsset ? draft.cnpj?.trim() || undefined : undefined,
      managementFee: fundAsset ? Number(draft.managementFee) || undefined : undefined,
      trackingMode: "maturity_detail",
      notes: draft.notes?.trim(),
    });
  }

  return (
    <form className="form-grid smart-form investment-form" onSubmit={submit}>
      <div className="inline-alert span-2">{mode === "fiis" ? "Cadastro exclusivo de FII. Depois, os prints atualizam cotas e valores sem misturar esta posição às demais categorias." : "Cadastro detalhado para acompanhar vencimento e renovação. Os totais do patrimônio são atualizados separadamente por categoria."}</div>
      <div className="form-section span-2">
        <div className="form-section-title"><strong>Tipo de investimento</strong><span>Cada opção pede somente as informações relevantes.</span></div>
        <label className="span-2">Tipo
          <select data-testid="investment-type" value={draft.assetType} disabled={mode === "fiis"} onChange={(event) => updateType(event.target.value as AssetType)}>
            {mode === "fiis" ? <option value="fii">Fundo Imobiliário (FII)</option> : <><option value="fixed_income">Renda Fixa</option><option value="fund">Fundo de Investimento</option><option value="stock">Ações</option><option value="treasury">Tesouro Direto</option><option value="cdb">CDB</option><option value="lci_lca">LCI / LCA</option><option value="crypto">Criptomoedas</option><option value="other">Outro</option></>}
          </select>
        </label>
      </div>

      {marketAsset ? (
        <>
          <label>{draft.assetType === "crypto" ? "Símbolo" : "Ticker"}<input value={draft.ticker} onChange={(event) => setDraft({ ...draft, ticker: event.target.value.toUpperCase() })} placeholder={draft.assetType === "fii" ? "Ex: KNRI11" : draft.assetType === "stock" ? "Ex: PETR4" : "Ex: BTC"} required /></label>
          <label>Nome / descrição<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={draft.assetType === "crypto" ? "Ex: Bitcoin" : "Nome do ativo"} required /></label>
          <label>{draft.assetType === "crypto" ? "Quantidade" : draft.assetType === "fii" ? "Qtd. de cotas" : "Qtd. de ações"}<input type="number" inputMode="decimal" min="0" step={draft.assetType === "crypto" ? "0.00000001" : "1"} value={draft.quantity || ""} onChange={(event) => updateQuantity(Number(event.target.value))} required /></label>
          <label>Preço médio (R$)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.averagePrice || ""} onChange={(event) => updateAveragePrice(Number(event.target.value))} /></label>
          <label>Preço atual (R$)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.currentPrice || ""} onChange={(event) => updateCurrentPrice(Number(event.target.value))} placeholder="Opcional" /></label>
          <label>Valor investido total<input type="number" inputMode="decimal" min="0" step="0.01" value={investedValue || ""} onChange={(event) => updateInvestedValue(Number(event.target.value))} /></label>
          <label>Valor atual total<input type="number" inputMode="decimal" min="0" step="0.01" value={currentValue || ""} onChange={(event) => updateCurrentValue(Number(event.target.value))} placeholder="Opcional" /></label>
          <label>Data de compra<input type="date" value={draft.buyDate} onChange={(event) => setDraft({ ...draft, buyDate: event.target.value })} /></label>
          <label>{draft.assetType === "crypto" ? "Exchange / carteira" : "Corretora"}<input value={draft.broker ?? ""} onChange={(event) => setDraft({ ...draft, broker: event.target.value })} placeholder={draft.assetType === "crypto" ? "Ex: Binance" : "Ex: XP, BTG, Clear"} /></label>
          {draft.assetType === "fii" || draft.assetType === "stock" ? <><label>Proventos acumulados<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.dividends || ""} onChange={(event) => setDraft({ ...draft, dividends: Number(event.target.value) })} /></label><label>Dividend yield (%)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.dividendYield ?? ""} onChange={(event) => setDraft({ ...draft, dividendYield: Number(event.target.value) || undefined })} /></label></> : null}
        </>
      ) : null}

      {fixedAsset ? (
        <>
          <label className="span-2">Nome do produto<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder={draft.assetType === "treasury" ? "Ex: Tesouro IPCA+ 2035" : draft.assetType === "lci_lca" ? "Ex: LCI 95% do CDI" : "Ex: CDB Pós-fixado 1 ano"} required /></label>
          <label>Valor aplicado<input type="number" inputMode="decimal" min="0" step="0.01" value={investedValue || ""} onChange={(event) => updateInvestedValue(Number(event.target.value))} required /></label>
          <label>Valor atual<input type="number" inputMode="decimal" min="0" step="0.01" value={currentValue || ""} onChange={(event) => updateCurrentValue(Number(event.target.value))} placeholder="Opcional" /></label>
          <label>Data de aplicação<input type="date" value={draft.buyDate} onChange={(event) => setDraft({ ...draft, buyDate: event.target.value })} /></label>
          <label>Vencimento<input type="date" value={draft.maturityDate ?? ""} onChange={(event) => setDraft({ ...draft, maturityDate: event.target.value || undefined })} required /></label>
          <label>Instituição / emissor<input value={draft.broker ?? ""} onChange={(event) => setDraft({ ...draft, broker: event.target.value })} placeholder="Ex: C6, Nubank, Tesouro Nacional" /></label>
          <label>Rentabilidade
            <select value={draft.rateType ?? "cdi"} onChange={(event) => setDraft({ ...draft, rateType: event.target.value as InvestmentAsset["rateType"] })}>
              <option value="cdi">% do CDI</option><option value="pre">Prefixado</option><option value="ipca">IPCA +</option><option value="selic">Selic</option><option value="other">Outro índice</option>
            </select>
          </label>
          <label>Taxa contratada (%)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.rateValue ?? ""} onChange={(event) => setDraft({ ...draft, rateValue: Number(event.target.value) || undefined })} placeholder={draft.rateType === "cdi" ? "Ex: 110" : "Ex: 12,5"} /></label>
          <label>Liquidez<input value={draft.liquidity ?? ""} onChange={(event) => setDraft({ ...draft, liquidity: event.target.value })} placeholder="Ex: diária ou no vencimento" /></label>
          {draft.assetType === "cdb" || draft.assetType === "lci_lca" ? <label className="check-row switch-row"><input type="checkbox" checked={Boolean(draft.hasFgc)} onChange={(event) => setDraft({ ...draft, hasFgc: event.target.checked })} /><span><strong>Coberto pelo FGC</strong><small>Marque se este título tem garantia.</small></span></label> : null}
        </>
      ) : null}

      {fundAsset ? (
        <>
          <label className="span-2">Nome do fundo<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Nome completo do fundo" required /></label>
          <label>CNPJ<input value={draft.cnpj ?? ""} onChange={(event) => setDraft({ ...draft, cnpj: event.target.value })} placeholder="00.000.000/0000-00" /></label>
          <label>Código / identificação<input value={draft.ticker} onChange={(event) => setDraft({ ...draft, ticker: event.target.value.toUpperCase() })} placeholder="Opcional" /></label>
          <label>Valor aplicado<input type="number" inputMode="decimal" min="0" step="0.01" value={investedValue || ""} onChange={(event) => updateInvestedValue(Number(event.target.value))} required /></label>
          <label>Valor atual<input type="number" inputMode="decimal" min="0" step="0.01" value={currentValue || ""} onChange={(event) => updateCurrentValue(Number(event.target.value))} placeholder="Opcional" /></label>
          <label>Data de aplicação<input type="date" value={draft.buyDate} onChange={(event) => setDraft({ ...draft, buyDate: event.target.value })} /></label>
          <label>Instituição / plataforma<input value={draft.broker ?? ""} onChange={(event) => setDraft({ ...draft, broker: event.target.value })} /></label>
          <label>Taxa de administração (% a.a.)<input type="number" inputMode="decimal" min="0" step="0.01" value={draft.managementFee ?? ""} onChange={(event) => setDraft({ ...draft, managementFee: Number(event.target.value) || undefined })} /></label>
        </>
      ) : null}

      {draft.assetType === "other" ? (
        <>
          <label className="span-2">Nome do investimento<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Como você identifica este investimento?" required /></label>
          <label>Valor investido<input type="number" inputMode="decimal" min="0" step="0.01" value={investedValue || ""} onChange={(event) => updateInvestedValue(Number(event.target.value))} required /></label>
          <label>Valor atual<input type="number" inputMode="decimal" min="0" step="0.01" value={currentValue || ""} onChange={(event) => updateCurrentValue(Number(event.target.value))} /></label>
          <label>Data de aplicação<input type="date" value={draft.buyDate} onChange={(event) => setDraft({ ...draft, buyDate: event.target.value })} /></label>
          <label>Vencimento<input type="date" value={draft.maturityDate ?? ""} onChange={(event) => setDraft({ ...draft, maturityDate: event.target.value || undefined })} /></label>
          <label className="span-2">Instituição<input value={draft.broker ?? ""} onChange={(event) => setDraft({ ...draft, broker: event.target.value })} /></label>
        </>
      ) : null}

      {draft.assetType === "fii" ? <div className="inline-alert span-2">Categoria exclusiva: <strong>{FII_CATEGORY_NAME}</strong>. A organização desta carteira é feita por ticker.</div> : (
        <label className="span-2">Categoria
          <select value={draft.category ?? ""} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>
            <option value="">Sem categoria</option>
            {categoryOptions.filter((category) => normalizeCategoryName(category.name) !== "sem categoria").map((category) => <option value={category.name} key={category.id}>{category.name}</option>)}
          </select>
        </label>
      )}
      <div className="span-2 investment-total-preview"><span>Investido<strong>{formatCurrency(investedValue)}</strong></span><span>Valor atual<strong>{formatCurrency(currentValue)}</strong></span><span>Resultado<strong className={currentValue >= investedValue ? "amount-positive" : "amount-negative"}>{formatCurrency(currentValue - investedValue)}</strong></span></div>
      <label className="span-2">Observações<textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} placeholder="Informações úteis sobre o ativo" /></label>
      <button className="primary-button span-2 form-submit" type="submit"><CheckCircle2 size={18} />Salvar {draft.assetType === "fii" ? "FII" : "investimento"}</button>
    </form>
  );
}

function GoalForm({ goal, categories, onSave }: { goal: Goal; categories: Category[]; onSave: (goal: Goal) => void }) {
  const [draft, setDraft] = useState(goal);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <label>Nome<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
      <label>Valor alvo<input type="number" value={draft.targetAmount} onChange={(event) => setDraft({ ...draft, targetAmount: Number(event.target.value) })} /></label>
      <label>Valor atual<input type="number" value={draft.currentAmount} onChange={(event) => setDraft({ ...draft, currentAmount: Number(event.target.value) })} /></label>
      <label>Prazo<input type="date" value={draft.dueDate} onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} /></label>
      <label>Categoria
        <select value={draft.categoryId ?? ""} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
          <option value="">Sem categoria</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>Status
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as Goal["status"] })}>
          <option value="active">Ativa</option>
          <option value="paused">Pausada</option>
          <option value="completed">Concluída</option>
        </select>
      </label>
      <button className="primary-button span-2" type="submit"><CheckCircle2 size={17} />Salvar meta</button>
    </form>
  );
}

function InvestmentTable({ assets, onEdit, onDelete }: { assets: InvestmentAsset[]; onEdit: (asset: InvestmentAsset) => void; onDelete: (id: string) => void }) {
  if (!assets.length) return <EmptyState title="Nenhum investimento detalhado" text="Cadastre aplicações individuais para controlar vencimentos e renovações." />;
  const orderedAssets = assets.slice().sort((a, b) => {
    if (a.maturityDate && b.maturityDate) return a.maturityDate.localeCompare(b.maturityDate);
    if (a.maturityDate) return -1;
    if (b.maturityDate) return 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
  return (
    <>
      <div className="investment-mobile-list">
        {orderedAssets.map((asset) => {
          const unitAsset = isUnitPricedAsset(asset.assetType);
          const title = unitAsset && asset.ticker ? normalizeTicker(asset.ticker) : asset.name || asset.ticker;
          const subtitle = unitAsset ? [asset.name, asset.broker].filter((item) => item && item !== title).join(" · ") : [asset.broker, asset.category].filter(Boolean).join(" · ");
          const status = getMaturityStatus(asset.maturityDate);
          const metrics = [
            { label: "Categoria", value: asset.category || assetTypeLabel(asset.assetType) },
            { label: "Aplicação", value: formatDate(asset.buyDate) },
            { label: "Vencimento", value: asset.maturityDate ? formatDate(asset.maturityDate) : "Sem prazo" },
          ];
          return (
            <article className="investment-mobile-card" key={asset.id}>
              <div className="investment-mobile-head">
                <div>
                  <strong>{title}</strong>
                  {subtitle ? <span>{subtitle}</span> : null}
                </div>
                <Pill>{assetTypeLabel(asset.assetType)}</Pill>
              </div>
              <div className="investment-mobile-metrics">
                {metrics.map((metric) => <span key={metric.label}>{metric.label}<strong>{metric.value}</strong></span>)}
                <span>Status<strong style={{ color: status.color }}>{status.label}</strong></span>
              </div>
              <div className="row-actions">
                <button className="icon-button" type="button" onClick={() => onEdit(asset)} aria-label={`Editar ${title}`}><Edit3 size={16} /></button>
                <button className="icon-button danger-icon" type="button" onClick={() => window.confirm("Excluir ativo?") && onDelete(asset.id)} aria-label={`Excluir ${title}`}><Trash2 size={16} /></button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="data-table-wrap investment-desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Aplicação</th>
              <th>Tipo</th>
              <th>Categoria</th>
              <th>Instituição</th>
              <th>Data da aplicação</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {orderedAssets.map((asset) => {
              const unitAsset = isUnitPricedAsset(asset.assetType);
              const title = unitAsset && asset.ticker ? normalizeTicker(asset.ticker) : asset.name || asset.ticker;
              const subtitle = unitAsset ? asset.name : formatInvestmentRate(asset);
              const status = getMaturityStatus(asset.maturityDate);
              return (
              <tr key={asset.id}>
                <td><strong>{title}</strong>{subtitle ? <span>{subtitle}</span> : null}</td>
                <td>{assetTypeLabel(asset.assetType)}</td>
                <td>{asset.category || "Sem categoria"}</td>
                <td>{asset.broker || "Não informada"}</td>
                <td>{formatDate(asset.buyDate)}</td>
                <td>{asset.maturityDate ? formatDate(asset.maturityDate) : "Sem vencimento"}</td>
                <td><Pill color={status.color}>{status.label}</Pill></td>
                <td>
                  <div className="row-actions">
                      <button className="icon-button" type="button" onClick={() => onEdit(asset)} aria-label={`Editar ${title}`}><Edit3 size={16} /></button>
                      <button className="icon-button danger-icon" type="button" onClick={() => window.confirm("Excluir ativo?") && onDelete(asset.id)} aria-label={`Excluir ${title}`}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function FiiRadarPanel({ assets, dividends, quotes, loading, error }: { assets: InvestmentAsset[]; dividends: DividendIncome[]; quotes: Record<string, FundQuote>; loading: boolean; error: string }) {
  if (!assets.length) return <EmptyState title="Nenhum FII cadastrado" text="Cadastre FIIs para comparar preço médio, cota atual, valorização e proventos." />;

  const rows = assets.map((asset) => {
    const quote = quotes[normalizeTicker(asset.ticker)];
    const currentPrice = quote?.price ?? asset.currentPrice;
    const currentValue = asset.quantity * currentPrice;
    const recordedDividends = dividends.filter((dividend) => dividend.assetId === asset.id).reduce((sum, dividend) => sum + dividend.amount, 0);
    const assetDividends = recordedDividends || asset.dividends;
    const quoteReturn = asset.averagePrice > 0 ? (currentPrice - asset.averagePrice) / asset.averagePrice : 0;
    const totalReturn = asset.investedValue > 0 ? (currentValue + assetDividends - asset.investedValue) / asset.investedValue : 0;
    const dividendReturn = asset.investedValue > 0 ? assetDividends / asset.investedValue : 0;

    return {
      asset,
      quote,
      ticker: normalizeTicker(asset.ticker),
      currentPrice,
      currentValue,
      dividends: assetDividends,
      quoteReturn,
      totalReturn,
      dividendReturn,
    };
  });

  const totalInvested = rows.reduce((sum, row) => sum + row.asset.investedValue, 0);
  const totalCurrent = rows.reduce((sum, row) => sum + row.currentValue, 0);
  const fiiAssetIds = new Set(assets.map((asset) => asset.id));
  const totalDividends = dividends.filter((dividend) => fiiAssetIds.has(dividend.assetId)).reduce((sum, dividend) => sum + dividend.amount, 0);
  const totalReturn = totalInvested > 0 ? (totalCurrent + totalDividends - totalInvested) / totalInvested : 0;
  const source = rows.find((row) => row.quote)?.quote;
  const chartData = rows.map((row) => ({
    ticker: row.ticker,
    valorizacao: row.quoteReturn,
    rendimento: row.dividendReturn,
    total: row.totalReturn,
  }));

  return (
    <div className="fii-radar">
      <div className="fii-radar-summary">
        <div>
          <span>Valor atualizado</span>
          <strong>{formatCurrency(totalCurrent)}</strong>
        </div>
        <div>
          <span>Proventos</span>
          <strong>{formatCurrency(totalDividends)}</strong>
        </div>
        <div>
          <span>Retorno total</span>
          <strong className={totalReturn >= 0 ? "amount-positive" : "amount-negative"}>{formatPercent(totalReturn)}</strong>
        </div>
      </div>
      <div className="fii-radar-chart">
        <ChartBox>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 10, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ticker" />
              <YAxis tickFormatter={(value) => formatPercent(Number(value))} />
              <Tooltip formatter={(value, name) => [formatPercent(Number(value)), name === "valorizacao" ? "Valorização da cota" : name === "rendimento" ? "Rendimento" : "Total"]} />
              <Legend />
              <Bar dataKey="valorizacao" fill="#38bdf8" name="Valorização" radius={[6, 6, 0, 0]} />
              <Bar dataKey="rendimento" fill="#a78bfa" name="Rendimento" radius={[6, 6, 0, 0]} />
              <Bar dataKey="total" fill="#5eead4" name="Total" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
      <div className="fii-radar-list">
        {rows.map((row) => (
          <div className="fii-row" key={row.asset.id}>
            <div>
              <strong>{row.ticker}</strong>
              <span>{row.asset.quantity} cotas · PM {formatCurrency(row.asset.averagePrice)}</span>
            </div>
            <div>
              <span>Cota atual</span>
              <strong>{formatCurrency(row.currentPrice)}</strong>
            </div>
            <div>
              <span>Cota</span>
              <strong className={row.quoteReturn >= 0 ? "amount-positive" : "amount-negative"}>{formatPercent(row.quoteReturn)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong className={row.totalReturn >= 0 ? "amount-positive" : "amount-negative"}>{formatPercent(row.totalReturn)}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="fii-radar-status">
        <span>{loading ? "Buscando cotas..." : source ? `Fonte: ${source.source} · ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(source.fetchedAt))}` : "Usando valores salvos na carteira."}</span>
        {error ? <strong>{error}</strong> : null}
      </div>
    </div>
  );
}

interface InvestmentCategorySummaryUpdate {
  category: string;
  currentValue: number;
  investedValue?: number;
  assetType?: InvestmentAsset["assetType"];
  sourceText?: string;
}

function InvestmentScreenshotUpdater({ assets, onSaveCategories }: { assets: InvestmentAsset[]; onSaveCategories: (summaries: InvestmentCategorySummaryUpdate[]) => void }) {
  const [analysis, setAnalysis] = useState<InvestmentImageAnalysis | null>(null);
  const [preview, setPreview] = useState<InvestmentUpdatePreview[]>([]);
  const [confirmed, setConfirmed] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    setPreview([]);
    setConfirmed("");
    try {
      const rawResult = await analyzeInvestmentScreenshots(files, assets, "other_investments");
      const result = {
        ...rawResult,
        updates: rawResult.updates.filter((update) => update.assetType !== "fii" && !isFiiCategoryName(update.category || update.name || undefined)),
      };
      const nextPreview = buildInvestmentUpdatePreview(result, assets);
      const unmatchedUpdates = getUnmatchedInvestmentUpdates(result, assets);
      setAnalysis({
        ...result,
        unmatched: [...result.unmatched, ...unmatchedUpdates],
      });
      setPreview(nextPreview);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o print agora.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="screenshot-updater">
      <label className="upload-zone compact-upload">
        <Upload size={22} />
        <strong>Enviar print dos outros investimentos</strong>
        <span>Use telas de CDBs, renda fixa, fundos e outros ativos. Prints de FIIs têm uma área própria.</span>
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
      </label>
      {loading ? <div className="inline-alert"><Loader2 className="spin" size={16} /> Lendo print com OCR local...</div> : null}
      {error ? <div className="inline-alert warning-alert">{error}</div> : null}
      {confirmed ? <div className="inline-alert">{confirmed}</div> : null}
      {analysis ? (
        <div className="ai-result-list">
          <strong>{analysis.summary}</strong>
          {preview.length ? preview.map((item) => (
            <div className="ai-result-row" key={`${item.category}-${item.sourceText}`}>
              <div>
                <strong>{item.category}</strong>
                <span>{item.sourceText}</span>
              </div>
              <div className="ai-result-values">
                <span>{formatCurrency(item.previousValue)} → {formatCurrency(item.nextValue)}</span>
                <strong className={item.delta >= 0 ? "amount-positive" : "amount-negative"}>{item.delta >= 0 ? "+" : ""}{formatCurrency(item.delta)}</strong>
              </div>
              <span>{Math.round(item.confidence * 100)}%</span>
            </div>
          )) : <span className="muted-inline">Nenhuma atualização com confiança suficiente para aplicar.</span>}
          {analysis.unmatched.length ? <span className="muted-inline">Sem ativo cadastrado: {analysis.unmatched.join(", ")}</span> : null}
          {preview.length ? (
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                applyInvestmentPreviewUpdates(preview, onSaveCategories);
                setConfirmed(`${preview.length} categoria(s) atualizada(s) sem duplicar as aplicações detalhadas.`);
                setPreview([]);
              }}
            >
              <CheckCircle2 size={17} />
              Confirmar atualizações
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface InvestmentUpdatePreview {
  category: string;
  assetType: InvestmentAsset["assetType"];
  sourceText: string;
  confidence: number;
  investedValue: number;
  previousValue: number;
  nextValue: number;
  delta: number;
}

function buildInvestmentUpdatePreview(result: InvestmentImageAnalysis, assets: InvestmentAsset[]) {
  const grouped = new Map<string, {
    category: string;
    assetType: InvestmentAsset["assetType"];
    investedValue: number;
    nextValue: number;
    confidence: number;
    sourceTexts: string[];
    explicitSummary: boolean;
  }>();

  result.updates.forEach((update) => {
    if (update.confidence < 0.55) return;
    const matchedAsset = findInvestmentUpdateAsset(update, assets);
    const category = update.category?.trim()
      || matchedAsset?.category?.trim()
      || (update.scope === "category_summary" ? update.name?.trim() : "")
      || (update.assetType ? assetTypeLabel(update.assetType) : "");
    if (!category) return;
    const key = normalizeCategoryName(category);
    const explicitSummary = update.scope === "category_summary";
    const updateValue = finiteOr(update.currentValue, matchedAsset?.currentValue ?? 0);
    const updateInvested = explicitSummary
      ? finiteOr(update.investedValue ?? update.averagePrice, 0)
      : finiteOr(update.investedValue ?? update.averagePrice, matchedAsset?.investedValue ?? updateValue);
    const current = grouped.get(key);
    if (!current || explicitSummary) {
      grouped.set(key, {
        category,
        assetType: update.assetType ?? matchedAsset?.assetType ?? "other",
        investedValue: updateInvested,
        nextValue: updateValue,
        confidence: update.confidence,
        sourceTexts: [update.sourceText],
        explicitSummary,
      });
      return;
    }
    if (current.explicitSummary) return;
    current.investedValue += updateInvested;
    current.nextValue += updateValue;
    current.confidence = Math.min(current.confidence, update.confidence);
    current.sourceTexts.push(update.sourceText);
  });

  const portfolioAssets = getPortfolioInvestments(assets);
  return [...grouped.values()].map((group) => {
    const existing = portfolioAssets.find((asset) => sameCategory(asset.category, group.category));
    const investedValue = group.explicitSummary && group.investedValue > 0
      ? group.investedValue
      : existing?.investedValue ?? group.investedValue ?? group.nextValue;
    const previousValue = existing?.currentValue ?? 0;
    return {
      category: group.category,
      assetType: group.assetType,
      sourceText: group.sourceTexts.join(" || "),
      confidence: group.confidence,
      investedValue,
      previousValue,
      nextValue: group.nextValue,
      delta: group.nextValue - previousValue,
    };
  }).sort((a, b) => a.category.localeCompare(b.category, "pt-BR"));
}

function getUnmatchedInvestmentUpdates(result: InvestmentImageAnalysis, assets: InvestmentAsset[]) {
  return result.updates
    .filter((update) => update.confidence >= 0.55 && !update.category && !findInvestmentUpdateAsset(update, assets) && !update.assetType)
    .map((update) => update.name || normalizeTicker(update.ticker) || update.sourceText)
    .filter(Boolean);
}

function findInvestmentUpdateAsset(update: InvestmentImageUpdate, assets: InvestmentAsset[]) {
  const detailedAssets = getDetailedInvestments(assets);
  const ticker = normalizeTicker(update.ticker);
  if (ticker) {
    const tickerMatch = detailedAssets.find((item) => normalizeTicker(item.ticker) === ticker);
    if (tickerMatch) return tickerMatch;
  }

  const updateName = normalizeInvestmentMatchText(update.name || update.sourceText);
  if (!updateName) return null;
  return detailedAssets.find((asset) => {
    const assetName = normalizeInvestmentMatchText(`${asset.name} ${asset.ticker} ${asset.category ?? ""}`);
    return assetName === updateName || assetName.includes(updateName) || updateName.includes(assetName);
  }) ?? null;
}

function normalizeInvestmentMatchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\|/g, "1")
    .replace(/\bcdbc6\b/gi, "cdb c6")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function applyInvestmentPreviewUpdates(preview: InvestmentUpdatePreview[], onSaveCategories: (summaries: InvestmentCategorySummaryUpdate[]) => void) {
  onSaveCategories(preview.map((item) => ({
      category: item.category,
      assetType: item.assetType,
      investedValue: item.investedValue,
      currentValue: item.nextValue,
      sourceText: item.sourceText,
  })));
}

function finiteOr(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

interface FiiScreenshotPreview {
  asset: InvestmentAsset;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  investedValue: number;
  confidence: number;
}

function FiiScreenshotUpdater({ assets, onUpdate }: { assets: InvestmentAsset[]; onUpdate: (asset: InvestmentAsset) => void }) {
  const [analysis, setAnalysis] = useState<InvestmentImageAnalysis | null>(null);
  const [preview, setPreview] = useState<FiiScreenshotPreview[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState("");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setLoading(true);
    setError("");
    setConfirmed("");
    setAnalysis(null);
    setPreview([]);
    try {
      const result = await analyzeInvestmentScreenshots(files, assets, "fiis");
      const nextPreview = buildFiiScreenshotPreview(result, assets);
      const unmatched = result.updates
        .filter((update) => update.assetType === "fii" && !findInvestmentUpdateAsset(update, assets))
        .map((update) => normalizeTicker(update.ticker) || update.name || "FII não identificado");
      setAnalysis({ ...result, unmatched: [...result.unmatched, ...unmatched] });
      setPreview(nextPreview);
      setSelected(Object.fromEntries(nextPreview.map((item) => [item.asset.id, true])));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler os FIIs deste print agora.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  const selectedItems = preview.filter((item) => selected[item.asset.id]);

  if (!assets.length) {
    return <EmptyState title="Cadastre seus FIIs primeiro" text="O print atualiza posições existentes com segurança. Cadastre o ticker uma vez e depois use a leitura automática." />;
  }

  return (
    <div className="screenshot-updater fii-screenshot-updater">
      <div className="import-step-strip" aria-label="Etapas da atualização">
        <span className={analysis ? "done" : "active"}><strong>1</strong> Enviar</span>
        <span className={analysis ? "active" : ""}><strong>2</strong> Conferir</span>
        <span><strong>3</strong> Confirmar</span>
      </div>
      <label className="upload-zone compact-upload fii-upload-zone">
        <Building2 size={24} />
        <strong>Selecionar print da carteira de FIIs</strong>
        <span>Deixe visíveis ticker, quantidade, preço atual, valor total e rentabilidade.</span>
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
      </label>
      {loading ? <div className="inline-alert"><Loader2 className="spin" size={16} /> Lendo posições e cotas no aparelho...</div> : null}
      {error ? <div className="inline-alert warning-alert">{error}</div> : null}
      {confirmed ? <div className="inline-alert">{confirmed}</div> : null}
      {analysis ? (
        <div className="fii-scan-review">
          <div className="scan-review-header">
            <div><strong>Conferência da leitura</strong><span>{analysis.summary} Nada será alterado antes da confirmação.</span></div>
            <Pill color="#a78bfa">{selectedItems.length} selecionado(s)</Pill>
          </div>
          {preview.length ? (
            <div className="fii-scan-list">
              {preview.map((item) => {
                const delta = item.currentValue - item.asset.currentValue;
                return (
                  <article className={`fii-scan-row ${selected[item.asset.id] ? "selected" : ""}`} key={item.asset.id}>
                    <div className="fii-scan-title">
                      <label className="check-row">
                        <input type="checkbox" checked={Boolean(selected[item.asset.id])} onChange={(event) => setSelected((current) => ({ ...current, [item.asset.id]: event.target.checked }))} />
                        <span><strong>{normalizeTicker(item.asset.ticker) || item.asset.name}</strong><small>{item.asset.name}</small></span>
                      </label>
                      <Pill color={item.confidence >= 0.8 ? "#5eead4" : "#fbbf24"}>{Math.round(item.confidence * 100)}% confiança</Pill>
                    </div>
                    <div className="fii-scan-metrics">
                      <div><span>Cotas</span><small>{item.asset.quantity} →</small><strong>{item.quantity}</strong></div>
                      <div><span>Cota atual</span><small>{formatCurrency(item.asset.currentPrice)} →</small><strong>{formatCurrency(item.currentPrice)}</strong></div>
                      <div><span>Preço médio</span><small>{formatCurrency(item.asset.averagePrice)} →</small><strong>{formatCurrency(item.averagePrice)}</strong></div>
                      <div><span>Posição</span><small>{formatCurrency(item.asset.currentValue)} →</small><strong>{formatCurrency(item.currentValue)}</strong></div>
                    </div>
                    <div className="fii-scan-delta">
                      <span>Variação identificada</span>
                      <strong className={delta >= 0 ? "amount-positive" : "amount-negative"}>{delta >= 0 ? "+" : ""}{formatCurrency(delta)}</strong>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : <span className="muted-inline">Nenhuma posição cadastrada pôde ser vinculada à leitura.</span>}
          {analysis.unmatched.length ? <div className="inline-alert warning-alert">Não vinculados: {[...new Set(analysis.unmatched)].join(", ")}. Confira se esses tickers já estão cadastrados.</div> : null}
          {selectedItems.length ? (
            <button
              className="primary-button confirm-scan-button"
              type="button"
              onClick={() => {
                selectedItems.forEach((item) => onUpdate({
                  ...item.asset,
                  quantity: item.quantity,
                  averagePrice: item.averagePrice,
                  currentPrice: item.currentPrice,
                  investedValue: item.investedValue,
                  currentValue: item.currentValue,
                }));
                setConfirmed(`${selectedItems.length} posição(ões) de FIIs atualizada(s). O total da categoria foi recalculado automaticamente.`);
                setPreview([]);
                setSelected({});
              }}
            >
              <CheckCircle2 size={17} />Confirmar posições selecionadas
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function buildFiiScreenshotPreview(result: InvestmentImageAnalysis, assets: InvestmentAsset[]) {
  const byAsset = new Map<string, FiiScreenshotPreview>();
  result.updates.forEach((update) => {
    if (update.assetType !== "fii" || update.confidence < 0.55) return;
    const asset = findInvestmentUpdateAsset(update, assets);
    if (!asset || !isFiiInvestment(asset)) return;
    const quantity = finitePositiveOr(update.quantity, asset.quantity);
    const currentValue = finitePositiveOr(update.currentValue, quantity * finitePositiveOr(update.currentPrice, asset.currentPrice));
    const currentPrice = finitePositiveOr(update.currentPrice, quantity > 0 ? currentValue / quantity : asset.currentPrice);
    const averagePrice = finitePositiveOr(update.averagePrice, asset.averagePrice);
    byAsset.set(asset.id, {
      asset,
      quantity,
      averagePrice,
      currentPrice,
      currentValue,
      investedValue: quantity * averagePrice,
      confidence: update.confidence,
    });
  });
  return [...byAsset.values()].sort((a, b) => normalizeTicker(a.asset.ticker).localeCompare(normalizeTicker(b.asset.ticker), "pt-BR"));
}

function finitePositiveOr(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : Math.max(0, fallback);
}

function FiiQuickUpdate({ assets, onUpdate }: { assets: InvestmentAsset[]; onUpdate: (asset: InvestmentAsset) => void }) {
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  return (
    <div className="stack-list fii-manual-update">
      <div className="inline-alert">Altere somente a cota desejada. A posição e o total de FIIs serão recalculados ao salvar.</div>
      {assets.map((asset) => (
        <div className="list-row fii-manual-row" key={asset.id}>
          <div><strong>{normalizeTicker(asset.ticker)}</strong><span>{asset.quantity} cotas · posição {formatCurrency(asset.currentValue)}</span></div>
          <label className="compact-value-field"><span>Nova cota</span><input type="number" min="0" inputMode="decimal" step="0.01" value={drafts[asset.id] ?? asset.currentPrice} onChange={(event) => setDrafts({ ...drafts, [asset.id]: Number(event.target.value) })} /></label>
          <button className="secondary-button" type="button" onClick={() => onUpdate({ ...asset, currentPrice: drafts[asset.id] ?? asset.currentPrice, currentValue: asset.quantity * (drafts[asset.id] ?? asset.currentPrice) })}><CheckCircle2 size={16} />Salvar</button>
        </div>
      ))}
    </div>
  );
}

function InvestmentCategoryQuickUpdate({ assets, onSaveCategory }: { assets: InvestmentAsset[]; onSaveCategory: (summary: InvestmentCategorySummaryUpdate) => void }) {
  const [drafts, setDrafts] = useState<Record<string, number>>(() => Object.fromEntries(assets.map((asset) => [asset.id, asset.currentValue])));

  return (
    <div className="category-update-list">
      {assets.map((asset) => {
        const nextValue = drafts[asset.id] ?? asset.currentValue;
        const delta = nextValue - asset.currentValue;
        const result = nextValue - asset.investedValue;
        return (
          <div className="list-row investment-update-row category-summary-update-row" key={asset.id}>
            <div>
              <strong>{asset.category || asset.name}</strong>
              <span>Total consolidado · atualizado {formatDate(asset.updatedAt.slice(0, 10))}</span>
            </div>
            <div className="update-current">
              <span>Atual salvo</span>
              <strong>{formatCurrency(asset.currentValue)}</strong>
            </div>
            <label className="compact-value-field"><span>Novo total</span><input type="number" min="0" inputMode="decimal" step="0.01" value={nextValue} onChange={(event) => setDrafts({ ...drafts, [asset.id]: Number(event.target.value) })} /></label>
            <div className="update-current">
              <span>Variação</span>
              <strong className={delta >= 0 ? "amount-positive" : "amount-negative"}>{delta >= 0 ? "+" : ""}{formatCurrency(delta)}</strong>
              <small className={result >= 0 ? "amount-positive" : "amount-negative"}>{formatPercent(asset.investedValue > 0 ? result / asset.investedValue : 0)}</small>
            </div>
            <button className="secondary-button" type="button" onClick={() => onSaveCategory({ category: asset.category || asset.name, currentValue: nextValue, investedValue: asset.investedValue, assetType: asset.assetType })}>Salvar</button>
          </div>
        );
      })}
    </div>
  );
}

function InvestmentCategoryOverview({ assets }: { assets: InvestmentAsset[] }) {
  if (!assets.length) return <EmptyState title="Sem totais por categoria" text="Envie um print consolidado ou atualize uma categoria manualmente." />;
  return (
    <div className="investment-category-overview">
      {assets.slice().sort((a, b) => b.currentValue - a.currentValue).map((asset) => {
        const result = asset.currentValue - asset.investedValue;
        return (
          <article className="investment-category-card" key={asset.id}>
            <div><strong>{asset.category || asset.name}</strong><span>{assetTypeLabel(asset.assetType)}</span></div>
            <strong>{formatCurrency(asset.currentValue)}</strong>
            <span>Aplicado {formatCurrency(asset.investedValue)}</span>
            <span className={result >= 0 ? "amount-positive" : "amount-negative"}>{result >= 0 ? "+" : ""}{formatCurrency(result)}</span>
          </article>
        );
      })}
    </div>
  );
}

function InvestmentFiiOverview({ assets, dividends }: { assets: InvestmentAsset[]; dividends: DividendIncome[] }) {
  const groups = new Map<string, { ticker: string; name: string; quantity: number; investedValue: number; currentValue: number; dividends: number }>();
  assets.forEach((asset) => {
    const ticker = normalizeTicker(asset.ticker) || asset.name;
    const recordedDividends = dividends.filter((dividend) => dividend.assetId === asset.id).reduce((sum, dividend) => sum + dividend.amount, 0);
    const current = groups.get(ticker) ?? { ticker, name: asset.name, quantity: 0, investedValue: 0, currentValue: 0, dividends: 0 };
    current.quantity += asset.quantity;
    current.investedValue += asset.investedValue;
    current.currentValue += asset.currentValue;
    current.dividends += recordedDividends || asset.dividends;
    groups.set(ticker, current);
  });
  const rows = [...groups.values()].sort((a, b) => b.currentValue - a.currentValue);
  if (!rows.length) return <EmptyState title="Nenhum FII detalhado" text="Cadastre os FIIs para ver o total acumulado de cada ativo." />;
  return (
    <div className="investment-category-overview">
      {rows.map((row) => {
        const result = row.currentValue + row.dividends - row.investedValue;
        const averagePrice = row.quantity > 0 ? row.investedValue / row.quantity : 0;
        return (
          <article className="investment-category-card" key={row.ticker}>
            <div><strong>{row.ticker}</strong><span>{row.name}</span></div>
            <strong>{formatCurrency(row.currentValue)}</strong>
            <span>{row.quantity} cota(s) · PM {formatCurrency(averagePrice)}</span>
            <span className={result >= 0 ? "amount-positive" : "amount-negative"}>{result >= 0 ? "+" : ""}{formatCurrency(result)}</span>
          </article>
        );
      })}
    </div>
  );
}

function InvestmentMaturityAgenda({ assets }: { assets: InvestmentAsset[] }) {
  const datedAssets = assets
    .filter((asset) => asset.maturityDate)
    .sort((a, b) => String(a.maturityDate).localeCompare(String(b.maturityDate)));
  if (!datedAssets.length) return <EmptyState title="Nenhum vencimento informado" text="Edite os investimentos detalhados e informe o vencimento para acompanhar a renovação." />;
  return (
    <div className="stack-list">
      {datedAssets.map((asset) => {
        const status = getMaturityStatus(asset.maturityDate);
        return (
          <div className="list-row maturity-row" key={asset.id}>
            <div><strong>{asset.name}</strong><span>{asset.category || assetTypeLabel(asset.assetType)} · {asset.broker || "Instituição não informada"}</span></div>
            <div className="maturity-date"><span>Vencimento</span><strong>{formatDate(asset.maturityDate || "")}</strong></div>
            <Pill color={status.color}>{status.label}</Pill>
          </div>
        );
      })}
    </div>
  );
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
  const { data } = useRequiredData();
  const categoryMap = getCategoryMap(data.categories);
  if (!transactions.length) return <EmptyState title="Sem transações" text="Cadastre ou importe movimentações para acompanhar o mês." />;
  return (
    <div className="stack-list">
      {transactions.map((transaction) => (
        <div className="list-row" key={transaction.id}>
          <div>
            <strong>{transaction.description}</strong>
            <span>{categoryMap.get(transaction.categoryId)?.name ?? "Sem categoria"} · {formatDate(transaction.date)}</span>
          </div>
          <strong className={transaction.type === "expense" || transaction.type === "investment" ? "amount-negative" : "amount-positive"}>
            {transaction.type === "expense" || transaction.type === "investment" ? "-" : "+"}{formatCurrency(transaction.amount)}
          </strong>
        </div>
      ))}
    </div>
  );
}

function PieChartBlock({ data }: { data: Array<{ name: string; value: number }> }) {
  const visibleData = data.filter((item) => item.value > 0);
  const total = visibleData.reduce((sum, item) => sum + item.value, 0);
  const compactTotal = total >= 10000
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(total)
    : formatCurrency(total);

  return (
    <div className="pie-chart-block">
      <div className="pie-chart-visual">
        <ResponsiveContainer>
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie data={visibleData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="58%" outerRadius="90%" paddingAngle={3} stroke="rgba(7, 11, 18, 0.86)" strokeWidth={2} isAnimationActive={false}>
              {visibleData.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pie-total">
          <span>Total</span>
          <strong>{compactTotal}</strong>
        </div>
      </div>
      <div className="pie-legend-list">
        {visibleData.map((item, index) => (
          <div className="pie-legend-item" key={item.name}>
            <i style={{ background: chartColors[index % chartColors.length], color: chartColors[index % chartColors.length] }} />
            <span>{item.name}</span>
            <strong>{total ? formatPercent(item.value / total) : "0%"}</strong>
            <small>{formatCurrency(item.value)}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Page({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="page">
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {action ? <div className="page-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function Panel({
  title,
  action,
  children,
  defaultCollapsed = false,
  mobileDefaultCollapsed = false,
}: {
  title?: string;
  action?: ReactNode;
  children?: ReactNode;
  defaultCollapsed?: boolean;
  mobileDefaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(() => defaultCollapsed || (mobileDefaultCollapsed && isMobileViewport()));
  const label = title ?? "painel";

  return (
    <section className={`panel ${collapsed ? "panel-collapsed" : ""}`}>
      <span className="panel-scan" aria-hidden="true" />
      <div className="panel-header">
        {title ? <h3>{title}</h3> : <span />}
        <div className="panel-actions">
          {action}
          <button
            className="icon-button panel-toggle"
            type="button"
            aria-expanded={!collapsed}
            aria-label={collapsed ? `Expandir ${label}` : `Minimizar ${label}`}
            onClick={() => setCollapsed((current) => !current)}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      {collapsed ? null : <div className="panel-content">{children}</div>}
    </section>
  );
}

function isMobileViewport() {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 820px)").matches;
}

function Modal({ title, open, onClose, children, wide }: { title: string; open: boolean; onClose: () => void; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="modal-layer" role="dialog" aria-modal="true">
      <button className="modal-backdrop" type="button" aria-label="Fechar" onClick={onClose} />
      <section className={`modal ${wide ? "modal-wide" : ""}`}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}><X size={18} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ size?: number }>; label: string; value: string; tone: "green" | "blue" | "red" | "purple" }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <div className="stat-icon"><Icon size={20} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <div className="stat-sparkline" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </article>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <Circle size={24} />
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function Pill({ color = "#64748b", children }: { color?: string; children: ReactNode }) {
  return <span className="pill" style={{ ["--pill-color" as string]: color }}>{children}</span>;
}

function ChartBox({ children }: { children: ReactNode }) {
  return <div className="chart-box">{children}</div>;
}

function Segmented({ value, onChange, items }: { value: string; onChange: (value: string) => void; items: Array<[string, string]> }) {
  return (
    <div className="segmented">
      {items.map(([id, label]) => (
        <button key={id} type="button" className={value === id ? "active" : ""} onClick={() => onChange(id)}>{label}</button>
      ))}
    </div>
  );
}

function useRequiredData() {
  const context = useAppData();
  if (!context.data || !context.user) throw new Error("Dados indisponíveis.");
  return { ...context, data: context.data, user: context.user };
}

function CategoryIcon({ name }: { name?: string }) {
  const Icon = categoryIcons[name || ""] ?? Circle;
  return <Icon size={15} />;
}

function normalizeCategoryName(name?: string) {
  return (name ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

function sameCategory(left?: string, right?: string) {
  return normalizeCategoryName(left) === normalizeCategoryName(right);
}

function getMaturityStatus(maturityDate?: string) {
  if (!maturityDate) return { label: "Sem vencimento", color: "#64748b" };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maturity = new Date(`${maturityDate}T00:00:00`);
  const days = Math.ceil((maturity.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { label: `Vencido há ${Math.abs(days)} dia(s)`, color: "#fb7185" };
  if (days === 0) return { label: "Vence hoje", color: "#f97316" };
  if (days <= 30) return { label: `Vence em ${days} dia(s)`, color: "#fbbf24" };
  if (days <= 90) return { label: `Próximo · ${days} dias`, color: "#38bdf8" };
  return { label: `${days} dias`, color: "#34d399" };
}

function formatCategoryUsage(transactions: number, investments: number) {
  const parts = [];
  if (transactions) parts.push(`${transactions} transação(ões)`);
  if (investments) parts.push(`${investments} investimento(s)`);
  return parts.length ? parts.join(" · ") : "sem uso";
}

function transactionFiiIncomeLabel(transaction: Transaction, investments: InvestmentAsset[]) {
  if (transaction.investmentIncomeType !== "fii_dividend" || !transaction.investmentAssetId) return "";
  const asset = investments.find((item) => item.id === transaction.investmentAssetId);
  return `Provento de FII · ${asset ? normalizeTicker(asset.ticker) || asset.name : "FII não encontrado"}`;
}

function createEmptyTransaction(type: TransactionType, accountId = "acc-carteira-principal"): Transaction {
  return {
    id: "new",
    type,
    amount: 0,
    date: toInputDate(),
    description: "",
    categoryId: type === "income" ? "cat-salario" : type === "investment" ? "cat-investimentos" : "cat-outros",
    accountId,
    paymentMethod: "Manual",
    status: "paid",
    notes: "",
    tags: [],
    source: "manual",
    createdAt: "",
    updatedAt: "",
  };
}

function createEmptyCategory(type: Category["type"] = "expense"): Category {
  return { id: "new", name: "", type, color: type === "investment" ? "#2563eb" : "#0f766e", icon: type === "investment" ? "Landmark" : "Circle", monthlyBudget: undefined };
}

function createEmptyInvestment(): InvestmentAsset {
  const now = new Date().toISOString();
  return {
    id: "new",
    assetType: "fixed_income",
    ticker: "",
    name: "",
    quantity: 1,
    averagePrice: 0,
    currentPrice: 0,
    investedValue: 0,
    currentValue: 0,
    dividends: 0,
    dividendYield: 0,
    buyDate: toInputDate(),
    broker: "",
    category: "",
    rateType: "cdi",
    rateValue: undefined,
    liquidity: "",
    hasFgc: true,
    trackingMode: "maturity_detail",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
}

function isUnitPricedAsset(type: AssetType) {
  return type === "fii" || type === "stock" || type === "crypto" || type === "fund";
}

function formatInvestmentRate(asset: InvestmentAsset) {
  if (!asset.rateType) return "";
  const labels: Record<NonNullable<InvestmentAsset["rateType"]>, string> = {
    cdi: "% CDI",
    pre: "% a.a.",
    ipca: "IPCA +",
    selic: "Selic",
    other: "Índice",
  };
  if (!asset.rateValue) return labels[asset.rateType];
  return asset.rateType === "cdi" ? `${asset.rateValue}% do CDI` : `${labels[asset.rateType]} ${asset.rateValue}%`;
}

function createEmptyGoal(): Goal {
  return {
    id: "new",
    name: "",
    targetAmount: 0,
    currentAmount: 0,
    dueDate: toInputDate(),
    status: "active",
    createdAt: new Date().toISOString(),
  };
}

function transactionTypeLabel(type: TransactionType) {
  const labels: Record<TransactionType, string> = {
    income: "Entrada",
    expense: "Saída",
    credit: "Crédito",
    investment: "Investimento",
    transfer: "Transferência",
  };
  return labels[type];
}

function statusLabel(status: TransactionStatus) {
  const labels: Record<TransactionStatus, string> = {
    paid: "Pago",
    pending: "Pendente",
    planned: "Planejado",
  };
  return labels[status];
}

function categoryTypeLabel(type: Category["type"]) {
  const labels: Record<Category["type"], string> = {
    income: "Receita",
    expense: "Despesa",
    investment: "Investimento",
    credit: "Crédito",
    both: "Ambos",
  };
  return labels[type];
}

function TrendingIcon({ size }: { size?: number }) {
  return <ChevronRight size={size} />;
}

export default App;
