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
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  Download,
  Edit3,
  FileSpreadsheet,
  Gauge,
  Landmark,
  LayoutDashboard,
  ListChecks,
  Loader2,
  LogOut,
  Menu,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  Upload,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import "./App.css";
import { AppDataProvider, useAppData } from "./hooks/useAppData";
import { analyzeImageFiles, parseCsvFile } from "./services/importService";
import { aiService } from "./services/aiService";
import { fetchFundQuotes, type FundQuote } from "./services/marketData";
import { analyzeInvestmentScreenshots, type InvestmentImageAnalysis } from "./services/investmentImageService";
import type {
  AssetType,
  Category,
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
  getCategoryMap,
  getDividendsByMonth,
  getInvestmentAllocation,
  getMonthlyCashflow,
  getPortfolioEvolution,
  groupExpensesByCategory,
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
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const summary = data ? calculateDashboard(data) : null;

  return (
    <>
      <TechBackdrop />
      <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">CF</div>
          <div>
            <strong>Cofrinho App</strong>
            <span>por Paulo Cardoso</span>
          </div>
        </div>
        <nav className="side-nav" aria-label="Navegação principal">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} onClick={() => setMenuOpen(false)}>
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
          <button className="icon-button mobile-only" type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow tech-status">
              <ShieldCheck size={15} />
              Carteira segura, sem conexão bancária obrigatória
            </span>
            <h1>Cofrinho App</h1>
          </div>
          <div className="topbar-actions">
            <button className="ghost-button hide-small" type="button" onClick={() => navigate("/transacoes")}>
              <Upload size={17} />
              Importar
            </button>
            <div className="user-pill">
              <UserRound size={17} />
              <span>{user?.name}</span>
            </div>
          </div>
        </header>
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Navegação mobile">
        {navigation.slice(0, 5).map((item) => (
          <NavLink key={item.to} to={item.to}>
            <item.icon size={19} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {menuOpen ? <button className="scrim" type="button" aria-label="Fechar menu" onClick={() => setMenuOpen(false)} /> : null}
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
        await signUp(name, email, password);
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
  const allocation = getInvestmentAllocation(data.investments);
  const fiiAssets = data.investments.filter((asset) => asset.assetType === "fii");
  const latest = [...data.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

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
      <div className="stats-grid">
        <StatCard icon={WalletCards} label="Saldo atual" value={formatCurrency(summary.balance)} tone="green" />
        <StatCard icon={Banknote} label="Receitas" value={formatCurrency(summary.income)} tone="blue" />
        <StatCard icon={ReceiptText} label="Despesas" value={formatCurrency(summary.expenses)} tone="red" />
        <StatCard icon={Gauge} label="Resultado do mês" value={formatCurrency(summary.result)} tone={summary.result >= 0 ? "green" : "red"} />
        <StatCard icon={Landmark} label="Patrimônio investido" value={formatCurrency(summary.current)} tone="purple" />
        <StatCard icon={TrendingIcon} label="Rentabilidade" value={formatPercent(summary.investmentReturnRate)} tone={summary.investmentReturn >= 0 ? "green" : "red"} />
      </div>

      <div className="dashboard-grid">
        <Panel title="Receitas x despesas">
          <ChartBox>
            <ResponsiveContainer>
              <BarChart data={cashflow}>
                <defs>
                  <linearGradient id="incomeBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5eead4" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.45} />
                  </linearGradient>
                  <linearGradient id="expenseBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.42} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="receitas" fill="url(#incomeBar)" name="Receitas" radius={[6, 6, 0, 0]} />
                <Bar dataKey="despesas" fill="url(#expenseBar)" name="Despesas" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Panel>
        <Panel title="Evolução do saldo">
          <ChartBox>
            <ResponsiveContainer>
              <AreaChart data={cashflow}>
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
        <Panel title="Distribuição dos investimentos" mobileDefaultCollapsed>
          {allocation.length ? <PieChartBlock data={allocation} /> : <EmptyState title="Carteira vazia" text="Cadastre seus FIIs, CDBs, ações ou crypto para acompanhar o patrimônio." />}
        </Panel>
        <div className="dashboard-wide">
          <Panel
            title="Radar de FIIs"
            mobileDefaultCollapsed
            action={(
              <button className="secondary-button" type="button" onClick={() => void refreshFiiQuotes()} disabled={quotesLoading || !fiiAssets.length}>
                {quotesLoading ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}
                Atualizar cotas
              </button>
            )}
          >
            <FiiRadarPanel assets={fiiAssets} quotes={quotes} loading={quotesLoading} error={quotesError} />
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
  const { data, addTransaction, updateTransaction, deleteTransaction, deleteTransactions, importTransactions } = useRequiredData();
  const categoryMap = useMemo(() => getCategoryMap(data.categories), [data.categories]);
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [filters, setFilters] = useState({ text: "", type: "all", category: "all", status: "all" });

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

  return (
    <Page
      title="Transações"
      action={
        <div className="action-row">
          <button className="secondary-button" type="button" onClick={() => setImportOpen(true)}>
            <Upload size={17} />
            Importar
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
      <Panel>
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

      <Panel>
        {filtered.length ? (
          <div className="data-table-wrap">
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
                      <span>{transaction.paymentMethod} · {transaction.source}</span>
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
        ) : (
          <EmptyState title="Nenhuma transação encontrada" text="Ajuste os filtros, cadastre manualmente ou importe um extrato." />
        )}
      </Panel>

      <Modal title={editing?.createdAt ? "Editar transação" : "Nova transação"} open={formOpen} onClose={() => setFormOpen(false)}>
        {editing ? <TransactionForm transaction={editing} data={data} onSave={save} /> : null}
      </Modal>
      <Modal title="Importar extrato ou print" open={importOpen} onClose={() => setImportOpen(false)} wide>
        <ImportFlow data={data} onImport={(items, fileName, source) => { importTransactions(items, fileName, source); setImportOpen(false); }} />
      </Modal>
    </Page>
  );
}

function CategoriesPage() {
  const { data, addCategory, updateCategory, deleteCategory } = useRequiredData();
  const [editing, setEditing] = useState<Category | null>(null);
  const usage = useMemo(
    () =>
      data.categories.map((category) => ({
        ...category,
        count: data.transactions.filter((transaction) => transaction.categoryId === category.id).length,
        spent: data.transactions.filter((transaction) => transaction.categoryId === category.id && transaction.type === "expense").reduce((sum, transaction) => sum + transaction.amount, 0),
      })),
    [data.categories, data.transactions],
  );

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
      <Panel>
        <div className="category-list">
        {usage.map((category) => (
          <article className="category-list-row" key={category.id}>
            <div className="category-main">
              <Pill color={category.color}>{category.icon}</Pill>
              <div>
                <strong>{category.name}</strong>
                <span>{categoryTypeLabel(category.type)} · {category.count} transação(ões)</span>
              </div>
            </div>
            <div className="category-metric">
              <span>Gasto</span>
              <strong>{formatCurrency(category.spent)}</strong>
            </div>
            <div className="category-metric">
              <span>Limite</span>
              <strong>{category.monthlyBudget ? formatCurrency(category.monthlyBudget) : "Sem limite"}</strong>
            </div>
            <div className="category-progress" aria-hidden="true">
              <span style={{ width: `${category.monthlyBudget ? Math.min((category.spent / category.monthlyBudget) * 100, 100) : 0}%`, background: category.color }} />
            </div>
            <div className="row-actions">
              <button className="icon-button" type="button" onClick={() => setEditing(category)} aria-label={`Editar ${category.name}`}><Edit3 size={16} /></button>
              <button
                className="icon-button danger-icon"
                type="button"
                aria-label={`Excluir ${category.name}`}
                onClick={() => {
                  const message = category.count ? "Categoria em uso. As transações serão realocadas para Sem categoria. Continuar?" : "Excluir categoria?";
                  if (window.confirm(message)) deleteCategory(category.id);
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </article>
        ))}
        </div>
      </Panel>
      <Modal title={editing?.id ? "Editar categoria" : "Nova categoria"} open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? <CategoryForm category={editing} onSave={save} /> : null}
      </Modal>
    </Page>
  );
}

function InvestmentsPage() {
  const { data, addInvestment, updateInvestment, deleteInvestment } = useRequiredData();
  const [tab, setTab] = useState<"lista" | "fiis" | "categorias">("lista");
  const [editing, setEditing] = useState<InvestmentAsset | null>(null);
  const summary = calculateDashboard(data);
  const allocation = getInvestmentAllocation(data.investments, tab === "categorias" ? "category" : "assetType");
  const fiiAssets = data.investments.filter((asset) => asset.assetType === "fii");
  const portfolio = getPortfolioEvolution(data.investments, data.dividends);

  function save(asset: InvestmentAsset) {
    if (data.investments.some((item) => item.id === asset.id)) updateInvestment(asset);
    else {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...payload } = asset;
      addInvestment(payload);
    }
    setEditing(null);
  }

  return (
    <Page title="Investimentos" action={<button className="primary-button" type="button" onClick={() => setEditing(createEmptyInvestment())}><Plus size={17} />Novo ativo</button>}>
      <div className="stats-grid compact">
        <StatCard icon={Landmark} label="Total investido" value={formatCurrency(summary.invested)} tone="blue" />
        <StatCard icon={BadgeDollarSign} label="Valor atual" value={formatCurrency(summary.current)} tone="green" />
        <StatCard icon={TrendingIcon} label="Resultado" value={formatCurrency(summary.investmentReturn)} tone={summary.investmentReturn >= 0 ? "green" : "red"} />
      </div>
      <Panel title="Atualizar por print" action={<Pill color="#38bdf8">IA</Pill>}>
        <InvestmentScreenshotUpdater assets={data.investments} onUpdate={updateInvestment} />
      </Panel>
      <Segmented value={tab} onChange={(value) => setTab(value as typeof tab)} items={[["lista", "Lista"], ["fiis", "FIIs"], ["categorias", "Categorias"]]} />
      {tab === "lista" ? (
        <div className="two-column">
          <Panel title="Carteira">
            <InvestmentTable assets={data.investments} onEdit={setEditing} onDelete={deleteInvestment} />
          </Panel>
          <Panel title="Evolução da carteira" mobileDefaultCollapsed>
            <ChartBox>
              <ResponsiveContainer>
                <LineChart data={portfolio}>
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
      ) : null}
      {tab === "fiis" ? (
        <div className="two-column">
          <Panel title="Atualização rápida de FIIs" action={<Pill>{fiiAssets.length} FII(s)</Pill>}>
            {fiiAssets.length ? <FiiQuickUpdate assets={fiiAssets} onUpdate={updateInvestment} /> : <EmptyState title="Nenhum FII cadastrado" text="Cadastre FIIs para acompanhar cotas, preço médio, cotação e proventos." />}
          </Panel>
          <Panel title="Proventos por mês" mobileDefaultCollapsed>
            <ChartBox>
              <ResponsiveContainer>
                <BarChart data={getDividendsByMonth(data.dividends)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `R$${Number(value)}`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#a78bfa" name="Proventos" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          </Panel>
        </div>
      ) : null}
      {tab === "categorias" ? (
        <div className="two-column">
          <Panel title="Distribuição por categoria">{allocation.length ? <PieChartBlock data={allocation} /> : <EmptyState title="Sem ativos" text="Cadastre ativos para ver a distribuição." />}</Panel>
          <Panel title="Resumo por categoria">
            <div className="stack-list">
              {allocation.map((item) => (
                <div className="list-row" key={item.name}>
                  <span>{item.name}</span>
                  <strong>{formatCurrency(item.value)}</strong>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      ) : null}
      <Modal title={editing?.id ? "Editar ativo" : "Novo ativo"} open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing ? <InvestmentForm asset={editing} onSave={save} /> : null}
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
                <BarChart data={getMonthlyCashflow(data.transactions, 6)}>
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
          <Panel title="Investimentos">
            <PieChartBlock data={getInvestmentAllocation(data.investments)} />
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

  return (
    <Page title="Relatórios visuais" action={<button className="secondary-button" type="button" onClick={() => window.print()}><Download size={17} />Preparar PDF</button>}>
      <div className="dashboard-grid">
        <Panel title="Relatório mensal">
          <ChartBox>
            <ResponsiveContainer>
              <AreaChart data={cashflow}>
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
        <Panel title="Relatório de investimentos">{data.investments.length ? <PieChartBlock data={getInvestmentAllocation(data.investments, "ticker")} /> : <EmptyState title="Sem investimentos" text="Cadastre ativos para acompanhar a carteira." />}</Panel>
        <Panel title="FIIs e dividendos">
          <ChartBox>
            <ResponsiveContainer>
              <BarChart data={dividends}>
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
            <label className="file-button"><Upload size={17} />Importar JSON<input type="file" accept="application/json" onChange={handleImport} /></label>
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
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, amount: Number(draft.amount) }); }}>
      <label>Tipo
        <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as TransactionType })}>
          <option value="income">Entrada</option>
          <option value="expense">Saída</option>
          <option value="credit">Crédito</option>
          <option value="investment">Investimento</option>
          <option value="transfer">Transferência</option>
        </select>
      </label>
      <label>Valor<input type="number" step="0.01" value={draft.amount} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} required /></label>
      <label>Data<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} required /></label>
      <label>Descrição<input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} required /></label>
      <label>Categoria
        <select value={draft.categoryId} onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}>
          {data.categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>Conta
        <select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}>
          {data.accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
        </select>
      </label>
      <label>Forma de pagamento<input value={draft.paymentMethod} onChange={(event) => setDraft({ ...draft, paymentMethod: event.target.value })} /></label>
      <label>Status
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as TransactionStatus })}>
          <option value="paid">Pago</option>
          <option value="pending">Pendente</option>
          <option value="planned">Planejado</option>
        </select>
      </label>
      <label>Tags<input value={draft.tags.join(", ")} onChange={(event) => setDraft({ ...draft, tags: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })} placeholder="fatura, recorrente" /></label>
      <label className="check-row"><input type="checkbox" checked={Boolean(draft.recurring)} onChange={(event) => setDraft({ ...draft, recurring: event.target.checked })} /> Recorrente</label>
      <label className="span-2">Observações<textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
      <button className="primary-button span-2" type="submit"><CheckCircle2 size={17} />Salvar transação</button>
    </form>
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
        <strong>Selecionar CSV, imagem ou PDF</strong>
        <span>O app cria uma prévia para você revisar antes de salvar.</span>
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
          <div className="data-table-wrap">
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
        <EmptyState title="Nenhum arquivo selecionado" text="CSV é importado de verdade. Imagens e PDFs geram uma prévia mockada até conectarmos OCR/IA no backend." />
      )}
    </div>
  );
}

function CategoryForm({ category, onSave }: { category: Category; onSave: (category: Category) => void }) {
  const [draft, setDraft] = useState(category);
  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave(draft); }}>
      <label>Nome<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
      <label>Tipo
        <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as Category["type"] })}>
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

function InvestmentForm({ asset, onSave }: { asset: InvestmentAsset; onSave: (asset: InvestmentAsset) => void }) {
  const [draft, setDraft] = useState(asset);
  const investedValue = Number(draft.quantity) * Number(draft.averagePrice);
  const currentValue = Number(draft.quantity) * Number(draft.currentPrice);

  return (
    <form className="form-grid" onSubmit={(event) => { event.preventDefault(); onSave({ ...draft, investedValue, currentValue }); }}>
      <label>Tipo
        <select value={draft.assetType} onChange={(event) => setDraft({ ...draft, assetType: event.target.value as AssetType })}>
          <option value="fii">FII</option>
          <option value="cdb">CDB</option>
          <option value="fixed_income">Renda fixa</option>
          <option value="stock">Ações</option>
          <option value="crypto">Crypto</option>
          <option value="treasury">Tesouro Direto</option>
          <option value="fund">Fundo</option>
          <option value="other">Outro</option>
        </select>
      </label>
      <label>Ticker<input value={draft.ticker} onChange={(event) => setDraft({ ...draft, ticker: event.target.value.toUpperCase() })} required /></label>
      <label>Nome<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label>
      <label>Quantidade<input type="number" step="0.000001" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })} /></label>
      <label>Preço médio<input type="number" step="0.01" value={draft.averagePrice} onChange={(event) => setDraft({ ...draft, averagePrice: Number(event.target.value) })} /></label>
      <label>Preço atual<input type="number" step="0.01" value={draft.currentPrice} onChange={(event) => setDraft({ ...draft, currentPrice: Number(event.target.value) })} /></label>
      <label>Dividendos/proventos<input type="number" step="0.01" value={draft.dividends} onChange={(event) => setDraft({ ...draft, dividends: Number(event.target.value) })} /></label>
      <label>Dividend yield (%)<input type="number" step="0.01" value={draft.dividendYield ?? ""} onChange={(event) => setDraft({ ...draft, dividendYield: Number(event.target.value) || undefined })} /></label>
      <label>Data de compra<input type="date" value={draft.buyDate} onChange={(event) => setDraft({ ...draft, buyDate: event.target.value })} /></label>
      <label>Vencimento<input type="date" value={draft.maturityDate ?? ""} onChange={(event) => setDraft({ ...draft, maturityDate: event.target.value })} /></label>
      <label>Corretora<input value={draft.broker ?? ""} onChange={(event) => setDraft({ ...draft, broker: event.target.value })} /></label>
      <label>Categoria<input value={draft.category ?? ""} onChange={(event) => setDraft({ ...draft, category: event.target.value })} /></label>
      <div className="span-2 inline-alert">Investido: {formatCurrency(investedValue)} · Atual: {formatCurrency(currentValue)}</div>
      <label className="span-2">Observações<textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
      <button className="primary-button span-2" type="submit"><CheckCircle2 size={17} />Salvar ativo</button>
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
  if (!assets.length) return <EmptyState title="Nenhum investimento cadastrado" text="Cadastre ativos manualmente ou use a importação por imagem para montar a carteira." />;
  return (
    <>
      <div className="investment-mobile-list">
        {assets.map((asset) => {
          const result = asset.currentValue + asset.dividends - asset.investedValue;
          return (
            <article className="investment-mobile-card" key={asset.id}>
              <div className="investment-mobile-head">
                <div>
                  <strong>{asset.ticker}</strong>
                  <span>{asset.name}</span>
                </div>
                <Pill>{assetTypeLabel(asset.assetType)}</Pill>
              </div>
              <div className="investment-mobile-metrics">
                <span>Qtd.<strong>{asset.quantity}</strong></span>
                <span>PM<strong>{formatCurrency(asset.averagePrice)}</strong></span>
                <span>Atual<strong>{formatCurrency(asset.currentPrice)}</strong></span>
                <span>Total<strong className={result >= 0 ? "amount-positive" : "amount-negative"}>{formatCurrency(result)}</strong></span>
              </div>
              <div className="row-actions">
                <button className="icon-button" type="button" onClick={() => onEdit(asset)} aria-label="Editar"><Edit3 size={16} /></button>
                <button className="icon-button danger-icon" type="button" onClick={() => window.confirm("Excluir ativo?") && onDelete(asset.id)} aria-label="Excluir"><Trash2 size={16} /></button>
              </div>
            </article>
          );
        })}
      </div>
      <div className="data-table-wrap investment-desktop-table">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Tipo</th>
              <th>Qtd.</th>
              <th>Preço médio</th>
              <th>Preço atual</th>
              <th>Resultado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const result = asset.currentValue + asset.dividends - asset.investedValue;
              return (
              <tr key={asset.id}>
                <td><strong>{asset.ticker}</strong><span>{asset.name}</span></td>
                <td>{assetTypeLabel(asset.assetType)}</td>
                <td>{asset.quantity}</td>
                <td>{formatCurrency(asset.averagePrice)}</td>
                <td>{formatCurrency(asset.currentPrice)}</td>
                <td className={result >= 0 ? "amount-positive" : "amount-negative"}>{formatCurrency(result)}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-button" type="button" onClick={() => onEdit(asset)} aria-label="Editar"><Edit3 size={16} /></button>
                    <button className="icon-button danger-icon" type="button" onClick={() => window.confirm("Excluir ativo?") && onDelete(asset.id)} aria-label="Excluir"><Trash2 size={16} /></button>
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

function FiiRadarPanel({ assets, quotes, loading, error }: { assets: InvestmentAsset[]; quotes: Record<string, FundQuote>; loading: boolean; error: string }) {
  if (!assets.length) return <EmptyState title="Nenhum FII cadastrado" text="Cadastre FIIs para comparar preço médio, cota atual, valorização e proventos." />;

  const rows = assets.map((asset) => {
    const quote = quotes[normalizeTicker(asset.ticker)];
    const currentPrice = quote?.price ?? asset.currentPrice;
    const currentValue = asset.quantity * currentPrice;
    const quoteReturn = asset.averagePrice > 0 ? (currentPrice - asset.averagePrice) / asset.averagePrice : 0;
    const totalReturn = asset.investedValue > 0 ? (currentValue + asset.dividends - asset.investedValue) / asset.investedValue : 0;
    const dividendReturn = asset.investedValue > 0 ? asset.dividends / asset.investedValue : 0;

    return {
      asset,
      quote,
      ticker: normalizeTicker(asset.ticker),
      currentPrice,
      currentValue,
      quoteReturn,
      totalReturn,
      dividendReturn,
    };
  });

  const totalInvested = rows.reduce((sum, row) => sum + row.asset.investedValue, 0);
  const totalCurrent = rows.reduce((sum, row) => sum + row.currentValue, 0);
  const totalDividends = rows.reduce((sum, row) => sum + row.asset.dividends, 0);
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
            <BarChart data={chartData}>
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

function InvestmentScreenshotUpdater({ assets, onUpdate }: { assets: InvestmentAsset[]; onUpdate: (asset: InvestmentAsset) => void }) {
  const [analysis, setAnalysis] = useState<InvestmentImageAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setLoading(true);
    setError("");
    setAnalysis(null);
    try {
      const result = await analyzeInvestmentScreenshots(files, assets);
      const applied = applyInvestmentUpdates(result, assets, onUpdate);
      setAnalysis({
        ...result,
        summary: applied ? `${result.summary} ${applied} ativo(s) atualizado(s).` : result.summary,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler o print agora.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  }

  if (!assets.length) return <EmptyState title="Sem ativos cadastrados" text="Cadastre seus investimentos antes de atualizar por print." />;

  return (
    <div className="screenshot-updater">
      <label className="upload-zone compact-upload">
        <Upload size={22} />
        <strong>Enviar print da carteira</strong>
        <span>A IA lê banco/corretora e atualiza ticker, cota, quantidade e valor total após casar com seus ativos.</span>
        <input type="file" accept="image/*" multiple onChange={handleFiles} />
      </label>
      {loading ? <div className="inline-alert"><Loader2 className="spin" size={16} /> Lendo print com IA...</div> : null}
      {error ? <div className="inline-alert warning-alert">{error}</div> : null}
      {analysis ? (
        <div className="ai-result-list">
          <strong>{analysis.summary}</strong>
          {analysis.updates.map((item) => (
            <div className="ai-result-row" key={`${item.ticker}-${item.sourceText}`}>
              <div>
                <strong>{normalizeTicker(item.ticker) || item.name || "Ativo identificado"}</strong>
                <span>{item.sourceText}</span>
              </div>
              <span>{Math.round(item.confidence * 100)}%</span>
            </div>
          ))}
          {analysis.unmatched.length ? <span className="muted-inline">Sem ativo cadastrado: {analysis.unmatched.join(", ")}</span> : null}
        </div>
      ) : null}
    </div>
  );
}

function applyInvestmentUpdates(result: InvestmentImageAnalysis, assets: InvestmentAsset[], onUpdate: (asset: InvestmentAsset) => void) {
  let applied = 0;
  result.updates.forEach((update) => {
    if (update.confidence < 0.55) return;
    const ticker = normalizeTicker(update.ticker);
    const asset = assets.find((item) => normalizeTicker(item.ticker) === ticker);
    if (!asset) return;

    const quantity = finiteOr(update.quantity, asset.quantity);
    const averagePrice = finiteOr(update.averagePrice, asset.averagePrice);
    const inferredPrice = update.currentPrice ?? (update.currentValue && quantity > 0 ? update.currentValue / quantity : null);
    const currentPrice = finiteOr(inferredPrice, asset.currentPrice);
    const currentValue = finiteOr(update.currentValue, quantity * currentPrice);
    const dividends = finiteOr(update.dividends, asset.dividends);

    onUpdate({
      ...asset,
      quantity,
      averagePrice,
      currentPrice,
      currentValue,
      dividends,
      notes: [asset.notes, `Atualizado por print com IA: ${update.sourceText}`].filter(Boolean).join("\n"),
    });
    applied += 1;
  });
  return applied;
}

function finiteOr(value: number | null | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function FiiQuickUpdate({ assets, onUpdate }: { assets: InvestmentAsset[]; onUpdate: (asset: InvestmentAsset) => void }) {
  const [drafts, setDrafts] = useState<Record<string, number>>(() => Object.fromEntries(assets.map((asset) => [asset.id, asset.currentPrice])));
  return (
    <div className="stack-list">
      <label className="upload-zone small">
        <Upload size={24} />
        <strong>Atualização manual rápida</strong>
        <span>Para print com IA, use o painel Atualizar por print na tela de Investimentos.</span>
      </label>
      {assets.map((asset) => (
        <div className="list-row" key={asset.id}>
          <div><strong>{asset.ticker}</strong><span>{asset.quantity} cotas · PM {formatCurrency(asset.averagePrice)}</span></div>
          <input type="number" step="0.01" value={drafts[asset.id] ?? asset.currentPrice} onChange={(event) => setDrafts({ ...drafts, [asset.id]: Number(event.target.value) })} />
          <button className="secondary-button" type="button" onClick={() => onUpdate({ ...asset, currentPrice: drafts[asset.id] ?? asset.currentPrice, currentValue: asset.quantity * (drafts[asset.id] ?? asset.currentPrice) })}>Salvar</button>
        </div>
      ))}
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
  return (
    <ChartBox>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={42} outerRadius={72} paddingAngle={3} stroke="rgba(7, 11, 18, 0.85)" strokeWidth={3}>
            {data.map((entry, index) => <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartBox>
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

function createEmptyCategory(): Category {
  return { id: "new", name: "", type: "expense", color: "#0f766e", icon: "Circle", monthlyBudget: undefined };
}

function createEmptyInvestment(): InvestmentAsset {
  const now = new Date().toISOString();
  return {
    id: "new",
    assetType: "fii",
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
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase().replace(/\.SA$/, "");
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
