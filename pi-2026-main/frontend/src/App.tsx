import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, relativeTime, formatRunAt, WEEKDAY_SHORT, type AlertItem, type DeviceDetail, type DeviceSummary, type Settings as SettingsData, type Regime, type RegimeKey, type Schedule, type IrrigationLogItem } from "./api";

/** Catálogo de regimes de chuva. Buscado uma vez da API e cacheado em memória — usado no cadastro e no detalhe do dispositivo. */
let regimesCache: Regime[] | null = null;
function useRegimes(): Regime[] {
  const [regimes, setRegimes] = useState<Regime[]>(regimesCache ?? []);
  useEffect(() => {
    if (regimesCache) return;
    api.regimes().then((r) => { regimesCache = r; setRegimes(r); }).catch(() => {});
  }, []);
  return regimes;
}

const REGIME_TONE: Record<RegimeKey, string> = { garoa: "cyan", leve: "green", moderada: "amber", forte: "blue" };

/** Perfil da conta (nome, propriedade...), compartilhado entre o cabeçalho, o menu lateral e a página de configurações. */
type Profile = { fullName: string; email: string; role: string; propertyName: string; propertyLocation: string };
const DEFAULT_PROFILE: Profile = { fullName: "Carregando...", email: "", role: "", propertyName: "Minha propriedade", propertyLocation: "" };
const ProfileContext = createContext<{ profile: Profile; refreshProfile: () => void; navigate: (p: Page) => void }>({ profile: DEFAULT_PROFILE, refreshProfile: () => {}, navigate: () => {} });

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(p => p[0]).join("").toUpperCase() || "—";
}

type Page = "dashboard" | "devices" | "device" | "add" | "alerts" | "settings";

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Visão geral", icon: "grid" },
  { id: "devices", label: "Meus dispositivos", icon: "cpu" },
  { id: "alerts", label: "Alertas", icon: "bell" },
  { id: "settings", label: "Configurações", icon: "settings" },
];

type IconName = "grid" | "cpu" | "bell" | "settings" | "droplet" | "thermometer" | "waves" | "sprout" | "plus" | "search" | "chevron" | "arrow" | "clock" | "activity" | "map" | "more" | "wifi" | "user" | "shield" | "palette" | "logout" | "menu" | "close" | "check" | "zap" | "calendar" | "filter" | "flask" | "cloudrain" | "trash" | "edit";

const paths: Record<IconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></>,
  cpu: <><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><rect x="9" y="9" width="6" height="6" rx="1"/></>,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.6-1H3v-4h.1A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88L4.2 6.56l2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.12.38.6 1 .6 1h1v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></>,
  droplet: <path d="M12 2.7S5.5 10 5.5 15a6.5 6.5 0 0 0 13 0C18.5 10 12 2.7 12 2.7Z"/>,
  thermometer: <><path d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/></>,
  waves: <><path d="M2 7c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 12c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 17c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0"/></>,
  sprout: <><path d="M12 22V10"/><path d="M7 14c-3.5 0-5-2-5-6 4 0 7 1.5 7 5"/><path d="M14 9c0-4 3-6 8-6 0 5-2.5 8-8 8"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  arrow: <path d="m5 12 14 0m-5-5 5 5-5 5"/>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  activity: <path d="M3 12h4l2.5-7 5 14 2.5-7h4"/>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z"/><path d="M9 3v15m6-12v15"/></>,
  more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="20" r="1"/></>,
  user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
  shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></>,
  palette: <><circle cx="12" cy="12" r="9"/><circle cx="8" cy="9" r="1"/><circle cx="12" cy="7" r="1"/><circle cx="16" cy="9" r="1"/><path d="M15 17c-1 0-2-.7-2-1.5s.7-1.5 1.5-1.5H17c2 0 3-1 3-3"/></>,
  logout: <><path d="M10 4H4v16h6M14 8l4 4-4 4m4-4H9"/></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16"/>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  zap: <path d="m13 2-9 12h8l-1 8 9-12h-8Z"/>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
  filter: <path d="M4 5h16l-6 7v6l-4 2v-8Z"/>,
  flask: <><path d="M9 2h6M10 2v6.2L4.7 18a1.8 1.8 0 0 0 1.6 2.7h11.4a1.8 1.8 0 0 0 1.6-2.7L14 8.2V2"/><path d="M7.5 14h9"/></>,
  cloudrain: <><path d="M17.5 18a4.5 4.5 0 0 0 0-9 6 6 0 0 0-11.4 1.8A4 4 0 0 0 6.5 18h11Z"/><path d="M8 20v1.5M12 20v2.5M16 20v1.5"/></>,
  trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></>,
  edit: <><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></>,
};

function Icon({ name, size = 20, className = "" }: { name: IconName; size?: number; className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Status({ status }: { status: DeviceSummary["status"] }) {
  const labels = { online: "Online", offline: "Offline", alerta: "Requer atenção" };
  return <span className={`status status-${status}`}><i />{labels[status]}</span>;
}

function Button({ children, variant = "primary", className = "", onClick, type = "button", disabled = false }: { children: ReactNode; variant?: "primary" | "secondary" | "ghost" | "danger"; className?: string; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant} ${className}`}>{children}</button>;
}

function MiniChart({ color = "#00a67e", fill = "#e7f7f1", points }: { color?: string; fill?: string; points?: string }) {
  const p = points || "0,45 30,38 60,42 90,24 120,29 150,18 180,23 210,10 240,16 270,8 300,12";
  return <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="h-full w-full overflow-visible">
    <defs><linearGradient id={`g${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={fill}/><stop offset="1" stopColor={fill} stopOpacity="0"/></linearGradient></defs>
    <polygon points={`${p} 300,60 0,60`} fill={`url(#g${color.slice(1)})`}/>
    <polyline points={p} fill="none" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>;
}

/** Converte uma série de leituras em pontos "x,y" para as mini-visualizações SVG (sparkline e gráficos grandes). */
function seriesToPoints(series: { moisture: number | null }[], width: number, height: number, fallback: number): string {
  const values = series.map((p) => (p.moisture == null ? fallback : p.moisture));
  if (values.length === 0) values.push(fallback, fallback);
  if (values.length === 1) values.push(values[0]);
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - (Math.max(0, Math.min(100, v)) / 100) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

const WEEKDAYS_PT = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"];
const MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function formatEyebrowDate(d = new Date()) {
  return `${WEEKDAYS_PT[d.getDay()]}, ${d.getDate()} DE ${MONTHS_PT[d.getMonth()].toUpperCase()}`;
}

function formatDatePt(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  return `${d.getDate()} de ${MONTHS_PT[d.getMonth()]} de ${d.getFullYear()}`;
}

function formatScheduleLabel(scheduleTime: string | null) {
  if (!scheduleTime) return "Não programada";
  const hhmm = scheduleTime.slice(0, 5);
  const now = new Date();
  const [h, m] = scheduleTime.split(":").map(Number);
  const isFuture = h > now.getHours() || (h === now.getHours() && m > now.getMinutes());
  return `${isFuture ? "Hoje" : "Amanhã"} às ${hhmm}`;
}

/** Mensagem amigável de estado (carregando/erro/vazio), reaproveitando o cartão de "tudo em dia" já existente no CSS. */
function StateNotice({ text }: { text: string }) {
  return <div className="card empty-state"><Icon name="activity" size={26}/><b>{text}</b></div>;
}

/** Converte uma série (qualquer métrica) em pontos "x,y" para um gráfico com domínio [min,max] configurável. */
function seriesToPointsGeneric(series: (number | null)[], width: number, height: number, fallback: number, min: number, max: number): string {
  const values = series.map((v) => (v == null ? fallback : v));
  if (values.length === 0) values.push(fallback, fallback);
  if (values.length === 1) values.push(values[0]);
  return values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const clamped = Math.max(min, Math.min(max, v));
    const y = height - ((clamped - min) / (max - min)) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

function fmtPh(v: number | null | undefined) { return v == null ? "—" : v.toFixed(1); }

/** Barrinha 0–14 com a faixa ideal marcada e um ponteiro no valor atual — usada em cartões de pH. */
function PhBar({ value, min, max }: { value: number | null; min: number; max: number }) {
  const pct = (v: number) => Math.max(0, Math.min(100, (v / 14) * 100));
  const outOfRange = value != null && (value < min || value > max);
  return <div className="ph-bar">
    <div className="ph-track">
      <span className="ph-band" style={{ left: `${pct(min)}%`, width: `${pct(max) - pct(min)}%` }} />
      {value != null && <i className={`ph-pointer ${outOfRange ? "out" : ""}`} style={{ left: `${pct(value)}%` }} />}
    </div>
    <div className="ph-scale"><span>0</span><span>7</span><span>14</span></div>
  </div>;
}

/** Cartão de regime de chuva selecionável (usado no controle manual e implicitamente nas programações). */
function RegimeOption({ regime, selected, onSelect }: { regime: Regime; selected: boolean; onSelect: () => void }) {
  return <button type="button" className={`regime-option ${selected ? "selected" : ""}`} onClick={onSelect}>
    <span className={`regime-icon ${REGIME_TONE[regime.key]}`}><Icon name="cloudrain" size={17}/></span>
    <div><b>{regime.label}</b><p>{regime.description}</p></div>
    <div className="regime-stats"><span>{regime.pumpPower}% bomba</span><span>{regime.mmPerHour} mm/h</span></div>
  </button>;
}

const DAY_LABELS = [{ n: 1, l: "Seg" }, { n: 2, l: "Ter" }, { n: 3, l: "Qua" }, { n: 4, l: "Qui" }, { n: 5, l: "Sex" }, { n: 6, l: "Sáb" }, { n: 7, l: "Dom" }];

function DayPicker({ days, onChange }: { days: number[]; onChange: (days: number[]) => void }) {
  const toggle = (n: number) => onChange(days.includes(n) ? days.filter(d => d !== n) : [...days, n].sort());
  return <div className="day-picker">{DAY_LABELS.map(d => <button type="button" key={d.n} className={days.includes(d.n) ? "active" : ""} onClick={() => toggle(d.n)}>{d.l}</button>)}</div>;
}

function daysLabel(days: number[]) {
  if (days.length === 7) return "Todos os dias";
  const weekdays = [1, 2, 3, 4, 5];
  if (days.length === 5 && weekdays.every(d => days.includes(d))) return "Dias úteis";
  if (days.length === 2 && days.includes(6) && days.includes(7)) return "Fins de semana";
  return days.map(n => DAY_LABELS.find(d => d.n === n)?.l).join(", ");
}

function Header({ title, eyebrow, onMenu }: { title: string; eyebrow?: string; onMenu: () => void }) {
  const { profile, navigate } = useContext(ProfileContext);
  return <header className="page-header">
    <button className="icon-btn lg:hidden" onClick={onMenu}><Icon name="menu" /></button>
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
    </div>
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <button className="icon-btn relative" aria-label="Ver alertas" onClick={() => navigate("alerts")}><Icon name="bell" size={19}/><span className="notification-dot" /></button>
      <button className="header-user" onClick={() => navigate("settings")}>
        <div className="avatar">{initials(profile.fullName)}</div>
        <div className="hidden sm:block"><strong>{profile.fullName}</strong><span>{profile.role || "—"}</span></div>
        <Icon name="chevron" size={14} className="hidden sm:block rotate-90 text-slate-400"/>
      </button>
    </div>
  </header>;
}

function Sidebar({ page, setPage, open, close, unreadAlerts }: { page: Page; setPage: (p: Page) => void; open: boolean; close: () => void; unreadAlerts: number }) {
  const { profile } = useContext(ProfileContext);
  return <>
    {open && <div className="sidebar-scrim lg:hidden" onClick={close}/>}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <div className="brand-mark"><Icon name="sprout" size={24}/><span /></div>
        <div><b>Verda</b><small>IoT Irrigação</small></div>
        <button onClick={close} className="ml-auto text-white/70 lg:hidden"><Icon name="close" /></button>
      </div>
      <button className="farm-chip" onClick={() => { setPage("settings"); close(); }}><span className="farm-avatar">{initials(profile.propertyName)}</span><div><small>PROPRIEDADE</small><b>{profile.propertyName}</b></div><Icon name="chevron" size={15} className="ml-auto rotate-90"/></button>
      <nav>
        <p className="nav-label">NAVEGAÇÃO</p>
        {navItems.map((item) => <button key={item.id} className={(page === item.id || (page === "device" && item.id === "devices") || (page === "add" && item.id === "devices")) ? "active" : ""} onClick={() => { setPage(item.id); close(); }}>
          <Icon name={item.icon} size={19}/><span>{item.label}</span>{item.id === "alerts" && unreadAlerts > 0 && <em>{unreadAlerts}</em>}
        </button>)}
      </nav>
      <div className="sidebar-health">
        <div><Icon name="activity" size={17}/><span>Saúde do sistema</span><b>98%</b></div>
        <div className="health-bar"><span /></div>
        <p>Todos os serviços operando</p>
      </div>
      <button className="sidebar-footer" onClick={() => { setPage("settings"); close(); }}>
        <div className="avatar">{initials(profile.fullName)}</div><div><b>{profile.fullName}</b><span>{profile.email || "—"}</span></div><Icon name="chevron" size={15} className="ml-auto"/>
      </button>
    </aside>
  </>;
}

function MetricCard({ icon, tone, label, value, unit, detail, children }: { icon: IconName; tone: string; label: string; value: string; unit?: string; detail: string; children?: ReactNode }) {
  return <div className="card metric-card">
    <div className={`metric-icon ${tone}`}><Icon name={icon} size={20}/></div>
    <div className="metric-copy"><span>{label}</span><strong>{value}<small>{unit}</small></strong><p>{detail}</p></div>
    {children && <div className="metric-visual">{children}</div>}
  </div>;
}

function Dashboard({ navigate, openDevice }: { navigate: (p: Page) => void; openDevice: (id: string) => void }) {
  const [data, setData] = useState<Awaited<ReturnType<typeof api.dashboard>> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.dashboard().then((d) => alive && setData(d)).catch((e) => alive && setError(e instanceof ApiError ? e.message : "Não foi possível carregar o painel."));
    return () => { alive = false; };
  }, []);

  if (error) return <div><Header title="Visão geral" onMenu={() => {}}/><main className="page-content"><StateNotice text={error}/></main></div>;
  if (!data) return <div><Header title="Visão geral" onMenu={() => {}}/><main className="page-content"><StateNotice text="Carregando painel..."/></main></div>;

  const onlinePct = data.deviceCounts.total ? Math.round((data.deviceCounts.online / data.deviceCounts.total) * 100) : 0;
  const chartPoints = seriesToPoints(data.moistureSeries, 700, 180, data.avgMoisture ?? 55);
  const lastPoint = chartPoints.split(" ").pop()!.split(",");
  const deltaLabel = data.avgMoistureDeltaPercent == null ? "Sem histórico suficiente"
    : `${data.avgMoistureDeltaPercent >= 0 ? "+" : ""}${data.avgMoistureDeltaPercent.toFixed(0)}% nas últimas 24h`;

  return <div>
    <Header title={`Bom dia, ${data.greetingName}`} eyebrow={formatEyebrowDate()} onMenu={() => {}}/>
    <main className="page-content">
      <section className="welcome-row">
        <div><p>Acompanhe a operação da sua irrigação em tempo real.</p></div>
        <Button onClick={() => navigate("add")}><Icon name="plus" size={18}/>Adicionar dispositivo</Button>
      </section>
      <section className="metrics-grid">
        <MetricCard icon="cpu" tone="green" label="Dispositivos" value={String(data.deviceCounts.total)} detail={`${data.deviceCounts.online} operando normalmente`}><div className="donut"><b>{onlinePct}%</b></div></MetricCard>
        <MetricCard icon="droplet" tone="cyan" label="Umidade média" value={data.avgMoisture == null ? "—" : data.avgMoisture.toFixed(0)} unit="%" detail={deltaLabel}><div className="spark"><MiniChart color="#159bbb" fill="#dff5f8" points={seriesToPoints(data.moistureSeries.slice(-11), 300, 55, data.avgMoisture ?? 55)}/></div></MetricCard>
        <MetricCard icon="waves" tone="blue" label="Nível dos reservatórios" value={data.avgWaterLevel == null ? "—" : data.avgWaterLevel.toFixed(0)} unit="%" detail={data.avgWaterLevel != null && data.avgWaterLevel < 40 ? "Abaixo do nível recomendado" : "Dentro do nível ideal"}><div className="tank"><span style={{ height: `${Math.round(data.avgWaterLevel ?? 0)}%` }}/><i>{data.avgWaterLevel == null ? "—" : `${data.avgWaterLevel.toFixed(0)}%`}</i></div></MetricCard>
        <MetricCard icon="bell" tone="amber" label="Alertas ativos" value={String(data.activeAlerts)} detail={`${data.highPriorityAlerts} alerta(s) de alta prioridade`}><span className="trend-badge" onClick={() => navigate("alerts")}>Ver alertas <Icon name="arrow" size={13}/></span></MetricCard>
      </section>

      <section className="metrics-grid secondary-grid">
        <MetricCard icon="flask" tone="violet" label="pH médio do solo" value={fmtPh(data.avgPh)} detail="Faixa ideal varia por cultura, veja no dispositivo"/>
        <MetricCard icon="thermometer" tone="amber" label="Temperatura média" value={data.avgTemperature == null ? "—" : data.avgTemperature.toFixed(1)} unit="°C" detail="Média entre todos os dispositivos"/>
        <MetricCard icon="cloudrain" tone="green" label="Regas hoje" value={String(data.irrigationsToday)} detail={`${data.waterMmToday.toFixed(1)} mm de água aplicada`}><span className="trend-badge" style={{ color: data.irrigatingNow ? "#0a8a68" : "#899994" }}>{data.irrigatingNow > 0 ? `${data.irrigatingNow} irrigando agora` : "Nenhuma em andamento"}</span></MetricCard>
      </section>

      <section className="dashboard-main">
        <div className="card chart-card">
          <div className="card-heading"><div><h2>Umidade do solo</h2><p>Média dos dispositivos nas últimas 24 horas</p></div><button className="select-btn">Últimas 24h <Icon name="chevron" size={14} className="rotate-90"/></button></div>
          <div className="legend"><span><i className="bg-emerald-500"/>Umidade média</span><span><i className="bg-cyan-400"/>Faixa ideal</span></div>
          <div className="big-chart">
            <div className="y-labels"><span>80%</span><span>60%</span><span>40%</span><span>20%</span></div>
            <div className="chart-area">
              <span className="ideal-band" />
              <svg viewBox="0 0 700 180" preserveAspectRatio="none">
                <defs><linearGradient id="dashfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13a47b" stopOpacity=".24"/><stop offset="1" stopColor="#13a47b" stopOpacity="0"/></linearGradient></defs>
                <polygon points={`${chartPoints} 700,180 0,180`} fill="url(#dashfill)"/>
                <polyline points={chartPoints} fill="none" stroke="#119b74" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx={lastPoint[0]} cy={lastPoint[1]} r="5" fill="#fff" stroke="#119b74" strokeWidth="3"/>
              </svg>
              <div className="x-labels"><span>00h</span><span>04h</span><span>08h</span><span>12h</span><span>16h</span><span>20h</span><span>Agora</span></div>
            </div>
          </div>
        </div>
        <div className="card alerts-card">
          <div className="card-heading"><div><h2>Alertas recentes</h2><p>O que precisa da sua atenção</p></div><button onClick={() => navigate("alerts")} className="link-button">Ver todos</button></div>
          <div className="alert-list">
            {data.recentAlerts.length ? data.recentAlerts.map((a) => <AlertRow key={a.id} alert={a}/>) : <p style={{ padding: "12px 2px", color: "#8c9c98", fontSize: "10px" }}>Nenhum alerta recente.</p>}
          </div>
          <button onClick={() => navigate("alerts")} className="alerts-footer">Ver central de alertas <Icon name="arrow" size={15}/></button>
        </div>
      </section>

      <section className="card devices-overview">
        <div className="card-heading"><div><h2>Seus dispositivos</h2><p>Status em tempo real da sua operação</p></div><button className="link-button" onClick={() => navigate("devices")}>Ver todos <Icon name="arrow" size={14}/></button></div>
        <div className="device-grid">{data.devices.slice(0, 3).map((d) => <DeviceCard key={d.id} device={d} onClick={() => openDevice(d.id)}/>)}</div>
      </section>

      <section className="dashboard-secondary">
        <div className="card weekly-card">
          <div className="card-heading"><div><h2>Rega aplicada na semana</h2><p>Lâmina de água estimada por dia, somando todos os dispositivos</p></div></div>
          <div className="bar-chart">{data.weeklyIrrigation.map((day) => {
            const max = Math.max(1, ...data.weeklyIrrigation.map(d => d.mm));
            const d = new Date(`${day.date}T00:00:00`);
            return <div key={day.date} className="bar-col">
              <span className="bar-value">{day.mm > 0 ? `${day.mm.toFixed(0)}mm` : ""}</span>
              <div className="bar-track"><i style={{ height: `${Math.max(3, (day.mm / max) * 100)}%` }}/></div>
              <small>{WEEKDAY_SHORT[(d.getDay() + 6) % 7]}</small>
            </div>;
          })}</div>
        </div>
        <div className="card upcoming-card">
          <div className="card-heading"><div><h2>Próximas regas</h2><p>Programações ativas</p></div></div>
          <div className="upcoming-list">{data.upcomingRuns.length ? data.upcomingRuns.map(u => <div key={u.scheduleId} className="upcoming-item" onClick={() => openDevice(u.deviceId)}>
            <span className={`regime-dot ${REGIME_TONE[u.regime]}`}/>
            <div><b>{u.scheduleName}</b><small>{u.deviceName} • {u.durationMin} min</small></div>
            <em>{formatRunAt(u.runAt)}</em>
          </div>) : <p style={{ padding: "12px 2px", color: "#8c9c98", fontSize: "10px" }}>Nenhuma programação ativa.</p>}</div>
        </div>
      </section>
    </main>
  </div>;
}

function AlertRow({ alert }: { alert: AlertItem }) {
  const icon = alert.level === "high" ? "droplet" : alert.level === "medium" ? "wifi" : "waves";
  return <div className="alert-item">
    <div className={`alert-icon ${alert.level}`}><Icon name={icon} size={18}/></div>
    <div><strong>{alert.title}</strong><span>{alert.deviceName ?? "—"}</span></div><time>{relativeTime(alert.createdAt)}</time>
  </div>;
}

function DeviceCard({ device, onClick }: { device: DeviceSummary; onClick: () => void }) {
  return <button className="device-card" onClick={onClick}>
    <div className="device-top"><div className="device-symbol"><Icon name="cpu"/></div><Status status={device.status}/>{device.irrigating && <span className="irrigating-chip"><Icon name="droplet" size={11}/>Irrigando</span>}</div>
    <h3>{device.name}</h3><p><Icon name="map" size={14}/>{device.location}</p>
    {device.crop && <p className="crop-line"><Icon name="sprout" size={13}/>{device.crop}</p>}
    <div className="device-stats"><span><Icon name="droplet" size={15}/><b>{device.moisture == null ? "—" : `${device.moisture.toFixed(0)}%`}</b><small>Umidade</small></span><span><Icon name="thermometer" size={15}/><b>{device.temperature == null ? "—" : `${device.temperature.toFixed(1)}°`}</b><small>Temperatura</small></span><span><Icon name="waves" size={15}/><b>{device.water == null ? "—" : `${device.water.toFixed(0)}%`}</b><small>Água</small></span><span><Icon name="flask" size={15}/><b>{fmtPh(device.ph)}</b><small>pH</small></span></div>
    <div className="device-foot"><span><Icon name="clock" size={13}/>Atualizado {relativeTime(device.lastSeenAt).toLowerCase()}</span><Icon name="chevron" size={16}/></div>
  </button>;
}

function Devices({ openDevice, navigate }: { openDevice: (id: string) => void; navigate: (p: Page) => void }) {
  const [devices, setDevices] = useState<DeviceSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"todos" | DeviceSummary["status"]>("todos");

  useEffect(() => {
    let alive = true;
    api.devices().then((d) => alive && setDevices(d)).catch((e) => alive && setError(e instanceof ApiError ? e.message : "Não foi possível carregar os dispositivos."));
    return () => { alive = false; };
  }, []);

  const filtered = (devices ?? []).filter(d => (filter === "todos" || d.status === filter) && d.name.toLowerCase().includes(query.toLowerCase()));
  const counts = (devices ?? []).reduce((acc, d) => { acc[d.status]++; return acc; }, { online: 0, offline: 0, alerta: 0 } as Record<DeviceSummary["status"], number>);

  return <div><Header title="Meus dispositivos" eyebrow="GERENCIAMENTO" onMenu={() => {}}/>
    <main className="page-content">
      <section className="welcome-row"><p>Gerencie e acompanhe todos os seus dispositivos conectados.</p><Button onClick={() => navigate("add")}><Icon name="plus" size={18}/>Adicionar dispositivo</Button></section>
      {error ? <StateNotice text={error}/> : !devices ? <StateNotice text="Carregando dispositivos..."/> : <>
        <div className="summary-strip"><span><b>{devices.length}</b> dispositivos</span><span><i className="online-dot"/><b>{counts.online}</b> online</span><span><i className="alert-dot"/><b>{counts.alerta}</b> com alerta</span><span><i className="offline-dot"/><b>{counts.offline}</b> offline</span></div>
        <div className="toolbar"><label className="search-field"><Icon name="search" size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nome ou localização..."/></label>
          <div className="filter-tabs">{(["todos", "online", "alerta", "offline"] as const).map(f => <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f === "todos" ? "Todos" : f === "alerta" ? "Com alerta" : f[0].toUpperCase()+f.slice(1)}</button>)}</div>
        </div>
        <div className="devices-list-grid">{filtered.map(d => <DeviceCard key={d.id} device={d} onClick={() => openDevice(d.id)}/>)}
          <button className="add-device-card" onClick={() => navigate("add")}><span><Icon name="plus" size={24}/></span><b>Adicionar novo dispositivo</b><p>Conecte um Arduino à sua plataforma</p></button>
        </div>
      </>}
    </main>
  </div>;
}

const PERIOD_DAYS = { "24 horas": 1, "7 dias": 7, "30 dias": 30 } as const;
type Period = keyof typeof PERIOD_DAYS;

const CHART_METRICS = {
  moisture: { label: "Umidade", unit: "%", min: 0, max: 100, color: "#079975", fillId: "chartFillMoisture" },
  ph: { label: "pH", unit: "", min: 0, max: 14, color: "#7c5cd6", fillId: "chartFillPh" },
  temperature: { label: "Temperatura", unit: "°C", min: 0, max: 45, color: "#d68b3d", fillId: "chartFillTemp" },
} as const;
type ChartMetric = keyof typeof CHART_METRICS;

type EditDeviceForm = {
  name: string; type: string; location: string; crop: string; connectivity: string;
  minMoisture: string; defaultDurationMin: string; minPh: string; maxPh: string; defaultRegime: RegimeKey;
  autoIrrigation: boolean; disconnectAlerts: boolean;
};

function DeviceDetail({ deviceId, navigate }: { deviceId: string | null; navigate: (p: Page) => void }) {
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("24 horas");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("moisture");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [selectedRegime, setSelectedRegime] = useState<RegimeKey>("moderada");
  const [minutes, setMinutes] = useState("15");
  const regimes = useRegimes();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<EditDeviceForm | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const load = () => {
    if (!deviceId) return;
    api.device(deviceId, PERIOD_DAYS[period]).then(setDetail).catch((e) => setError(e instanceof ApiError ? e.message : "Não foi possível carregar o dispositivo."));
  };

  useEffect(() => {
    if (!deviceId) return;
    let alive = true;
    setDetail(null);
    api.device(deviceId, PERIOD_DAYS[period]).then((d) => alive && setDetail(d)).catch((e) => alive && setError(e instanceof ApiError ? e.message : "Não foi possível carregar o dispositivo."));
    return () => { alive = false; };
  }, [deviceId, period]);

  useEffect(() => {
    if (detail) { setSelectedRegime(detail.defaultRegime); setMinutes(String(detail.defaultDurationMin)); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail?.id]);

  if (!deviceId) return <div><Header title="Dispositivo" onMenu={() => {}}/><main className="page-content"><StateNotice text="Selecione um dispositivo na lista para ver os detalhes."/><Button variant="secondary" className="mt-3" onClick={() => navigate("devices")}>Ver meus dispositivos</Button></main></div>;
  if (error) return <div><Header title="Dispositivo" onMenu={() => {}}/><main className="page-content"><StateNotice text={error}/></main></div>;
  if (!detail) return <div><Header title="Dispositivo" onMenu={() => {}}/><main className="page-content"><StateNotice text="Carregando dispositivo..."/></main></div>;

  const startWithRegime = async () => {
    setBusy(true); setActionError(null);
    try {
      setDetail(await api.startIrrigation(detail.id, Number(minutes) || detail.defaultDurationMin, selectedRegime));
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Não foi possível iniciar a irrigação.");
    } finally {
      setBusy(false);
    }
  };

  const toggleIrrigation = async () => {
    if (detail.irrigating) {
      setBusy(true); setActionError(null);
      try { setDetail(await api.stopIrrigation(detail.id)); }
      catch (e) { setActionError(e instanceof ApiError ? e.message : "Não foi possível interromper a irrigação."); }
      finally { setBusy(false); }
    } else {
      await startWithRegime();
    }
  };

  const openEdit = () => {
    setEditForm({
      name: detail.name, type: detail.type, location: detail.location, crop: detail.crop, connectivity: detail.connectivity,
      minMoisture: String(detail.minMoisture), defaultDurationMin: String(detail.defaultDurationMin),
      minPh: String(detail.minPh), maxPh: String(detail.maxPh), defaultRegime: detail.defaultRegime,
      autoIrrigation: detail.autoIrrigation, disconnectAlerts: detail.disconnectAlerts,
    });
    setEditError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!editForm) return;
    if (!editForm.name.trim()) { setEditError("Informe um nome para o dispositivo."); return; }
    if (!editForm.location.trim()) { setEditError("Informe a localização do dispositivo."); return; }
    const minPh = Number(editForm.minPh.replace(",", "."));
    const maxPh = Number(editForm.maxPh.replace(",", "."));
    if (Number.isNaN(minPh) || Number.isNaN(maxPh) || minPh < 0 || maxPh > 14 || minPh >= maxPh) { setEditError("Faixa de pH inválida: o mínimo deve ser menor que o máximo (entre 0 e 14)."); return; }
    const minMoisture = Number(editForm.minMoisture);
    if (Number.isNaN(minMoisture) || minMoisture < 0 || minMoisture > 100) { setEditError("O limite mínimo de umidade deve ser um valor entre 0 e 100."); return; }
    const defaultDurationMin = Number(editForm.defaultDurationMin);
    if (!Number.isFinite(defaultDurationMin) || defaultDurationMin < 1 || defaultDurationMin > 240) { setEditError("A duração padrão deve ser entre 1 e 240 minutos."); return; }
    setEditSaving(true); setEditError(null);
    try {
      await api.updateDeviceProfile(detail.id, { name: editForm.name.trim(), type: editForm.type, location: editForm.location.trim(), crop: editForm.crop.trim(), connectivity: editForm.connectivity.trim() });
      await api.updateDeviceSettings(detail.id, { minMoisture, defaultDurationMin, autoIrrigation: editForm.autoIrrigation, disconnectAlerts: editForm.disconnectAlerts, minPh, maxPh, defaultRegime: editForm.defaultRegime });
      setEditing(false);
      load();
    } catch (e) {
      setEditError(e instanceof ApiError ? e.message : "Não foi possível salvar as alterações.");
    } finally {
      setEditSaving(false);
    }
  };

  const removeDevice = async () => {
    if (!window.confirm(`Excluir "${detail.name}"?\n\nEssa ação é permanente e remove o histórico de leituras, programações e alertas deste dispositivo.`)) return;
    setDeleteBusy(true); setDeleteError(null);
    try {
      await api.deleteDevice(detail.id);
      navigate("devices");
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : "Não foi possível excluir o dispositivo.");
      setDeleteBusy(false);
    }
  };

  const tempPct = detail.temperature == null ? 0 : Math.max(0, Math.min(100, (detail.temperature / 45) * 100));
  const selectedRegimeObj = regimes.find(r => r.key === selectedRegime);
  const estimatedMm = selectedRegimeObj ? Math.round(selectedRegimeObj.mmPerHour * (Number(minutes) || 0) / 60 * 10) / 10 : null;

  const cfg = CHART_METRICS[chartMetric];
  const currentValue = chartMetric === "moisture" ? detail.moisture : chartMetric === "ph" ? detail.ph : detail.temperature;
  const chartPoints = seriesToPointsGeneric(detail.series.map(p => p[chartMetric]), 700, 200, currentValue ?? (cfg.min + cfg.max) / 2, cfg.min, cfg.max);
  const band: [number, number] | null = chartMetric === "moisture" ? [55, 75] : chartMetric === "ph" ? [detail.minPh, detail.maxPh] : null;
  const bandTop = band ? 100 - ((band[1] - cfg.min) / (cfg.max - cfg.min)) * 100 : 0;
  const bandHeight = band ? ((band[1] - band[0]) / (cfg.max - cfg.min)) * 100 : 0;

  return <div><Header title={detail.name} eyebrow="DETALHES DO DISPOSITIVO" onMenu={() => {}}/>
    <main className="page-content">
      <button className="back-link" onClick={() => navigate("devices")}><span>‹</span> Voltar aos dispositivos</button>
      <section className="device-hero card">
        <div className="hero-device-icon"><Icon name="cpu" size={30}/><i/></div>
        <div><div className="flex items-center gap-3"><h2>{detail.name}</h2><Status status={detail.status}/></div><p>{detail.id} <span>•</span> {detail.type} <span>•</span> {detail.location}{detail.crop && <><span>•</span> {detail.crop}</>}</p><small><Icon name="clock" size={13}/> Última atualização {relativeTime(detail.lastSeenAt).toLowerCase()}</small></div>
        <div className="hero-actions">
          <Button variant="secondary" onClick={() => editing ? setEditing(false) : openEdit()}><Icon name={editing ? "close" : "edit"} size={16}/>{editing ? "Cancelar edição" : "Editar"}</Button>
          <button className="icon-btn danger" title="Excluir dispositivo" aria-label="Excluir dispositivo" onClick={removeDevice} disabled={deleteBusy}><Icon name="trash" size={16}/></button>
        </div>
      </section>
      {deleteError && <p className="inline-error">{deleteError}</p>}
      {editing && editForm && <section className="card edit-card">
        <div className="card-heading"><div><h2>Editar dispositivo</h2><p>Dados do equipamento e parâmetros de irrigação</p></div><button className="icon-btn" onClick={() => setEditing(false)} aria-label="Fechar"><Icon name="close" size={16}/></button></div>
        <div className="form-grid compact">
          <label><span>Nome do dispositivo</span><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}/></label>
          <label><span>Tipo de dispositivo</span><select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}><option>Irrigador Pro</option><option>Irrigador Mini</option><option>Sensor de reservatório</option></select></label>
          <label><span>Localização</span><input value={editForm.location} onChange={e => setEditForm({ ...editForm, location: e.target.value })}/></label>
          <label><span>Cultura</span><input placeholder="Ex.: Tomate, hortaliças..." value={editForm.crop} onChange={e => setEditForm({ ...editForm, crop: e.target.value })}/></label>
          <label><span>Conectividade</span><input value={editForm.connectivity} onChange={e => setEditForm({ ...editForm, connectivity: e.target.value })}/></label>
          <label><span>Limite mínimo de umidade</span><div className="unit-input"><input type="number" min={0} max={100} value={editForm.minMoisture} onChange={e => setEditForm({ ...editForm, minMoisture: e.target.value })}/><b>%</b></div></label>
          <label><span>Duração padrão</span><div className="unit-input"><input type="number" min={1} max={240} value={editForm.defaultDurationMin} onChange={e => setEditForm({ ...editForm, defaultDurationMin: e.target.value })}/><b>min</b></div></label>
          <label><span>pH mínimo ideal</span><div className="unit-input"><input type="number" step="0.1" min={0} max={14} value={editForm.minPh} onChange={e => setEditForm({ ...editForm, minPh: e.target.value })}/><b>pH</b></div></label>
          <label><span>pH máximo ideal</span><div className="unit-input"><input type="number" step="0.1" min={0} max={14} value={editForm.maxPh} onChange={e => setEditForm({ ...editForm, maxPh: e.target.value })}/><b>pH</b></div></label>
          <label className="full"><span>Regime de chuva padrão</span><div className="regime-chip-row">{regimes.map(r => <button type="button" key={r.key} className={`regime-chip ${REGIME_TONE[r.key]} ${editForm.defaultRegime === r.key ? "active" : ""}`} onClick={() => setEditForm({ ...editForm, defaultRegime: r.key })}><Icon name="cloudrain" size={13}/>{r.label}</button>)}</div></label>
          <label className="full toggle-option"><div><span>Irrigação automática</span><small>Ativar quando a umidade estiver abaixo do limite.</small></div><input type="checkbox" checked={editForm.autoIrrigation} onChange={e => setEditForm({ ...editForm, autoIrrigation: e.target.checked })}/></label>
          <label className="full toggle-option"><div><span>Alertas de desconexão</span><small>Notificar quando o dispositivo ficar offline.</small></div><input type="checkbox" checked={editForm.disconnectAlerts} onChange={e => setEditForm({ ...editForm, disconnectAlerts: e.target.checked })}/></label>
        </div>
        {editError && <p className="inline-error" style={{ margin: "0 0 12px 25px" }}>{editError}</p>}
        <div className="form-footer compact"><Button variant="secondary" onClick={() => setEditing(false)}>Cancelar</Button><Button disabled={editSaving} onClick={saveEdit}>{editSaving ? "Salvando..." : "Salvar alterações"}</Button></div>
      </section>}
      <section className="detail-metrics">
        <DetailMetric icon="droplet" tone="cyan" label="Umidade do solo" value={detail.moisture == null ? "—" : `${detail.moisture.toFixed(0)}%`} state={detail.status === "alerta" ? "Abaixo do limite" : "Ideal"} progress={detail.moisture ?? 0}/>
        <DetailMetric icon="thermometer" tone="amber" label="Temperatura" value={detail.temperature == null ? "—" : `${detail.temperature.toFixed(1)}°C`} state="Normal" progress={tempPct}/>
        <DetailMetric icon="waves" tone="blue" label="Nível de água" value={detail.water == null ? "—" : `${detail.water.toFixed(0)}%`} state={detail.water != null && detail.water < 40 ? "Baixo" : "Bom"} progress={detail.water ?? 0}/>
        <DetailMetric icon="flask" tone="violet" label="pH do solo" value={fmtPh(detail.ph)} state={detail.ph != null && (detail.ph < detail.minPh || detail.ph > detail.maxPh) ? "Fora da faixa ideal" : "Dentro da faixa"} progress={detail.ph == null ? 0 : (detail.ph / 14) * 100}/>
        <DetailMetric icon="activity" tone="green" label="Irrigação" value={detail.irrigating ? "Ativa" : "Desligada"} state={detail.irrigating ? "Manual" : `Próxima: ${formatScheduleLabel(detail.scheduleTime)}`} progress={detail.irrigating ? 100 : 0}/>
      </section>
      <section className="detail-layout">
        <div className="card history-card">
          <div className="card-heading">
            <div><h2>{cfg.label === "Umidade" ? "Umidade do solo" : cfg.label} ao longo do tempo</h2><p>Leituras do sensor no período selecionado</p></div>
            <button className="select-btn" onClick={() => setPeriod(period === "24 horas" ? "7 dias" : period === "7 dias" ? "30 dias" : "24 horas")}><Icon name="calendar" size={15}/>{period}<Icon name="chevron" size={13} className="rotate-90"/></button>
          </div>
          <div className="chart-tabs">
            <button className={chartMetric === "moisture" ? "active" : ""} onClick={() => setChartMetric("moisture")}><Icon name="droplet" size={13}/>Umidade</button>
            <button className={chartMetric === "ph" ? "active" : ""} onClick={() => setChartMetric("ph")}><Icon name="flask" size={13}/>pH</button>
            <button className={chartMetric === "temperature" ? "active" : ""} onClick={() => setChartMetric("temperature")}><Icon name="thermometer" size={13}/>Temperatura</button>
          </div>
          <div className="detail-chart">
            {band && <div className="threshold-label">Faixa ideal {band[0]}–{band[1]}{cfg.unit}</div>}
            {band && <span className="ideal-band" style={{ top: `${bandTop}%`, height: `${bandHeight}%` }}/>}
            <svg viewBox="0 0 700 200" preserveAspectRatio="none"><defs><linearGradient id={cfg.fillId} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={cfg.color} stopOpacity=".23"/><stop offset="1" stopColor={cfg.color} stopOpacity="0"/></linearGradient></defs><polygon points={`${chartPoints} 700,200 0,200`} fill={`url(#${cfg.fillId})`}/><polyline points={chartPoints} fill="none" stroke={cfg.color} strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg>
            <div className="chart-hours"><span>{period === "24 horas" ? "00h" : period}</span><span>{period === "24 horas" ? "08h" : "atrás"}</span><span></span><span>{period === "24 horas" ? "16h" : ""}</span><span></span><span></span><span>Agora</span></div>
          </div>
        </div>
        <div className="card manual-card">
          <div className={`manual-visual ${detail.irrigating ? "running" : ""}`}><span><Icon name={detail.irrigating ? "droplet" : "zap"} size={30}/></span><i/><i/><i/></div>
          <h2>Controle manual</h2><p>{detail.irrigating ? "Irrigação em andamento. Você pode interromper a qualquer momento." : "Acione a irrigação imediatamente, independentemente da programação."}</p>
          {!detail.irrigating && regimes.length > 0 && <div className="regime-chip-row">{regimes.map(r => <button type="button" key={r.key} className={`regime-chip ${REGIME_TONE[r.key]} ${selectedRegime === r.key ? "active" : ""}`} onClick={() => setSelectedRegime(r.key)}><Icon name="cloudrain" size={13}/>{r.label}</button>)}</div>}
          {!detail.irrigating && selectedRegimeObj && <p className="regime-hint">{selectedRegimeObj.description}</p>}
          <div className="duration-row">
            <span>Duração</span>
            {detail.irrigating ? <b>{detail.irrigationMinutes} minutos{detail.irrigationRegime ? ` • ${regimes.find(r => r.key === detail.irrigationRegime)?.label ?? detail.irrigationRegime}` : ""}</b>
              : <div className="unit-input"><input type="number" min={1} max={240} value={minutes} onChange={e => setMinutes(e.target.value)}/><b>min</b></div>}
          </div>
          {!detail.irrigating && estimatedMm != null && <p className="regime-hint">≈ {estimatedMm} mm de água aplicada</p>}
          {actionError && <p className="inline-error" style={{ margin: "0 0 10px" }}>{actionError}</p>}
          <Button variant={detail.irrigating ? "danger" : "primary"} className="w-full" onClick={toggleIrrigation} disabled={busy}><Icon name={detail.irrigating ? "close" : "droplet"} size={17}/>{busy ? "Aguarde..." : detail.irrigating ? "Interromper irrigação" : "Iniciar irrigação"}</Button>
          <small><Icon name="shield" size={13}/> Desligamento automático ativado</small>
        </div>
      </section>
      <section className="detail-layout">
        <ScheduleManager deviceId={detail.id} schedules={detail.schedules} regimes={regimes} onChanged={load}/>
        <IrrigationHistoryCard history={detail.history}/>
      </section>
      <section className="card info-table"><div className="card-heading"><div><h2>Informações do dispositivo</h2><p>Dados técnicos e conectividade</p></div></div><div className="info-grid"><Info label="Identificação" value={detail.id}/><Info label="Modelo" value={`Verda ${detail.type}`}/><Info label="Cultura" value={detail.crop || "Não informada"}/><Info label="Firmware" value={detail.firmware}/><Info label="Conectividade" value={detail.connectivity}/><Info label="Instalado em" value={formatDatePt(detail.installedAt)}/></div></section>
    </main>
  </div>;
}

function ScheduleManager({ deviceId, schedules, regimes, onChanged }: { deviceId: string; schedules: Schedule[]; regimes: Regime[]; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", days: [1, 2, 3, 4, 5, 6, 7] as number[], startTime: "06:30", durationMin: "15", regime: "moderada" as RegimeKey });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.name.trim() || form.days.length === 0) { setError("Dê um nome à programação e escolha ao menos um dia."); return; }
    setSaving(true); setError(null);
    try {
      await api.createSchedule(deviceId, { name: form.name.trim(), days: form.days, startTime: form.startTime, durationMin: Number(form.durationMin) || 15, regime: form.regime });
      setForm({ name: "", days: [1, 2, 3, 4, 5, 6, 7], startTime: "06:30", durationMin: "15", regime: "moderada" });
      setAdding(false);
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível criar a programação.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (s: Schedule) => { try { await api.toggleSchedule(deviceId, s.id, !s.enabled); onChanged(); } catch { /* ignora falha pontual */ } };
  const remove = async (s: Schedule) => { try { await api.deleteSchedule(deviceId, s.id); onChanged(); } catch { /* ignora falha pontual */ } };

  return <div className="card schedule-card">
    <div className="card-heading">
      <div><h2>Programações de rega</h2><p>Regas automáticas por dia da semana</p></div>
      <button className="select-btn" onClick={() => setAdding(a => !a)}><Icon name={adding ? "close" : "plus"} size={14}/>{adding ? "Cancelar" : "Nova"}</button>
    </div>
    {adding && <div className="schedule-form">
      <div className="form-grid compact">
        <label><span>Nome</span><input placeholder="Ex.: Rega da manhã" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></label>
        <label><span>Horário</span><input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}/></label>
        <label><span>Duração</span><div className="unit-input"><input type="number" min={1} max={240} value={form.durationMin} onChange={e => setForm({ ...form, durationMin: e.target.value })}/><b>min</b></div></label>
        <label><span>Regime de chuva</span><select value={form.regime} onChange={e => setForm({ ...form, regime: e.target.value as RegimeKey })}>{regimes.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}</select></label>
        <label className="full"><span>Dias da semana</span><DayPicker days={form.days} onChange={d => setForm({ ...form, days: d })}/></label>
      </div>
      {error && <p className="inline-error" style={{ margin: "0 0 12px 25px" }}>{error}</p>}
      <div className="form-footer compact"><Button disabled={saving} onClick={submit}>{saving ? "Salvando..." : "Salvar programação"}</Button></div>
    </div>}
    <div className="schedule-list">
      {schedules.length ? schedules.map(s => <div key={s.id} className={`schedule-row ${!s.enabled ? "disabled" : ""}`}>
        <span className={`regime-dot ${REGIME_TONE[s.regime]}`}/>
        <div><b>{s.name}</b><small>{daysLabel(s.days)} • {s.startTime} • {s.durationMin} min • ≈{s.estimatedMm} mm</small></div>
        <span className="schedule-next">{s.enabled ? formatRunAt(s.nextRunAt) : "Pausada"}</span>
        <button className={`switch small ${s.enabled ? "on" : ""}`} onClick={() => toggle(s)}><i/></button>
        <button className="icon-btn" onClick={() => remove(s)}><Icon name="trash" size={14}/></button>
      </div>) : <p className="schedule-empty">Nenhuma programação cadastrada. Crie uma para regar este dispositivo automaticamente.</p>}
    </div>
  </div>;
}

function IrrigationHistoryCard({ history }: { history: IrrigationLogItem[] }) {
  return <div className="card history-list-card">
    <div className="card-heading"><div><h2>Histórico de irrigações</h2><p>Últimos ciclos deste dispositivo</p></div></div>
    <div className="history-log">
      {history.length ? history.map(h => <div key={h.id} className="history-row">
        <span className={`regime-dot ${REGIME_TONE[h.regime]}`}/>
        <div><b>{h.running ? "Em andamento" : "Concluída"}</b><small>{new Date(h.startedAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} • {h.mode === "manual" ? "Manual" : h.scheduleName ?? "Agendada"}</small></div>
        <em>{h.actualMinutes} min<span>≈{h.estimatedMm} mm</span></em>
      </div>) : <p className="schedule-empty">Nenhuma irrigação registrada ainda.</p>}
    </div>
  </div>;
}

function DetailMetric({ icon, tone, label, value, state, progress }: { icon: IconName; tone: string; label: string; value: string; state: string; progress: number }) {
  return <div className="card detail-metric"><div className={`metric-icon ${tone}`}><Icon name={icon}/></div><span>{label}</span><strong>{value}</strong><div className="metric-progress"><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}/></div><small>{state}</small></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b>{value}</b></div>; }

type AddForm = { name: string; type: string; id: string; location: string; crop: string; minMoisture: string; defaultDurationMin: string; minPh: string; maxPh: string; defaultRegime: RegimeKey; autoIrrigation: boolean; disconnectAlerts: boolean };

const DEVICE_ID_PATTERN = /^[A-Z0-9-]{4,40}$/;

function AddDevice({ navigate }: { navigate: (p: Page) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AddForm>({ name: "", type: "Irrigador Pro", id: "", location: "", crop: "", minMoisture: "40", defaultDurationMin: "15", minPh: "5.5", maxPh: "7.0", defaultRegime: "moderada", autoIrrigation: true, disconnectAlerts: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const regimes = useRegimes();

  const goToStep2 = () => {
    if (!form.name.trim()) { setFormError("Informe o nome do dispositivo."); return; }
    if (!form.location.trim()) { setFormError("Informe a localização do dispositivo."); return; }
    if (!DEVICE_ID_PATTERN.test(form.id)) { setFormError("Código de identificação inválido. Use de 4 a 40 caracteres: letras maiúsculas, números e hífen (ex.: ARD-IRR-0421)."); return; }
    setFormError(null);
    setStep(2);
  };

  const submit = async () => {
    const minMoisture = Number(form.minMoisture);
    const defaultDurationMin = Number(form.defaultDurationMin);
    const minPh = Number(form.minPh.replace(",", "."));
    const maxPh = Number(form.maxPh.replace(",", "."));
    if (Number.isNaN(minMoisture) || minMoisture < 0 || minMoisture > 100) { setFormError("O limite mínimo de umidade deve ser um valor entre 0 e 100."); return; }
    if (!Number.isFinite(defaultDurationMin) || defaultDurationMin < 1 || defaultDurationMin > 240) { setFormError("A duração padrão deve ser entre 1 e 240 minutos."); return; }
    if (Number.isNaN(minPh) || Number.isNaN(maxPh) || minPh < 0 || maxPh > 14 || minPh >= maxPh) { setFormError("Faixa de pH inválida: o mínimo deve ser menor que o máximo (entre 0 e 14)."); return; }
    setSubmitting(true); setFormError(null);
    try {
      await api.createDevice({
        name: form.name.trim(), type: form.type, id: form.id, location: form.location.trim(), crop: form.crop.trim(),
        minMoisture, defaultDurationMin, autoIrrigation: form.autoIrrigation, disconnectAlerts: form.disconnectAlerts,
        minPh, maxPh, defaultRegime: form.defaultRegime,
      });
      setStep(3);
    } catch (e) {
      setFormError(e instanceof ApiError ? e.message : "Não foi possível cadastrar o dispositivo.");
    } finally {
      setSubmitting(false);
    }
  };

  return <div><Header title="Adicionar dispositivo" eyebrow="CONFIGURAÇÃO" onMenu={() => {}}/>
    <main className="page-content narrow-page">
      <button className="back-link" onClick={() => navigate("devices")}><span>‹</span> Cancelar e voltar</button>
      <div className="stepper"><Step n={1} label="Identificação" active={step >= 1}/><i className={step >= 2 ? "done" : ""}/><Step n={2} label="Irrigação e solo" active={step >= 2}/><i className={step >= 3 ? "done" : ""}/><Step n={3} label="Concluir" active={step >= 3}/></div>
      {step < 3 ? <section className="card form-card">
        <div className="form-heading"><div className="form-icon"><Icon name={step === 1 ? "cpu" : "settings"} size={25}/></div><div><h2>{step === 1 ? "Identifique seu dispositivo" : "Preferências de irrigação e solo"}</h2><p>{step === 1 ? "Insira os dados encontrados na etiqueta do seu Arduino." : "Defina os parâmetros iniciais. Você poderá alterá-los depois."}</p></div></div>
        {step === 1 ? <div className="form-grid">
          <label><span>Nome do dispositivo</span><input placeholder="Ex.: Horta principal" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/><small>Use um nome fácil de reconhecer.</small></label>
          <label><span>Tipo de dispositivo</span><select value={form.type} onChange={e => setForm({...form, type:e.target.value})}><option>Irrigador Pro</option><option>Irrigador Mini</option><option>Sensor de reservatório</option></select></label>
          <label className="full"><span>Código de identificação</span><div className="input-prefix"><Icon name="cpu" size={17}/><input placeholder="ARD-IRR-0000" maxLength={40} value={form.id} onChange={e => setForm({...form, id: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")})}/></div><small>4 a 40 caracteres: letras, números e hífen — está impresso na parte inferior do dispositivo.</small></label>
          <label className="full"><span>Localização</span><div className="input-prefix"><Icon name="map" size={17}/><input placeholder="Ex.: Estufa 01, Setor B" value={form.location} onChange={e => setForm({...form, location:e.target.value})}/></div></label>
          <label className="full"><span>Cultura</span><div className="input-prefix"><Icon name="sprout" size={17}/><input placeholder="Ex.: Tomate, hortaliças, citros..." value={form.crop} onChange={e => setForm({...form, crop:e.target.value})}/></div><small>Ajuda a definir a faixa ideal de pH e a leitura do painel.</small></label>
        </div> : <div className="form-grid">
          <label><span>Limite mínimo de umidade</span><div className="unit-input"><input type="number" value={form.minMoisture} onChange={e => setForm({...form, minMoisture: e.target.value})}/><b>%</b></div><small>Um alerta será enviado abaixo deste valor.</small></label>
          <label><span>Duração padrão</span><div className="unit-input"><input type="number" value={form.defaultDurationMin} onChange={e => setForm({...form, defaultDurationMin: e.target.value})}/><b>min</b></div></label>
          <label><span>pH mínimo ideal</span><div className="unit-input"><input type="number" step="0.1" min={0} max={14} value={form.minPh} onChange={e => setForm({...form, minPh: e.target.value})}/><b>pH</b></div></label>
          <label><span>pH máximo ideal</span><div className="unit-input"><input type="number" step="0.1" min={0} max={14} value={form.maxPh} onChange={e => setForm({...form, maxPh: e.target.value})}/><b>pH</b></div></label>
          <label className="full"><span>Regime de chuva padrão</span><div className="regime-chip-row">{(regimes.length ? regimes : []).map(r => <button type="button" key={r.key} className={`regime-chip ${REGIME_TONE[r.key]} ${form.defaultRegime === r.key ? "active" : ""}`} onClick={() => setForm({...form, defaultRegime: r.key})}><Icon name="cloudrain" size={13}/>{r.label}</button>)}</div><small>Usado nas irrigações manuais e programações criadas para este dispositivo.</small></label>
          <label className="full toggle-option"><div><span>Irrigação automática</span><small>Ativar quando a umidade estiver abaixo do limite.</small></div><input type="checkbox" checked={form.autoIrrigation} onChange={e => setForm({...form, autoIrrigation: e.target.checked})}/></label>
          <label className="full toggle-option"><div><span>Alertas de desconexão</span><small>Notificar quando o dispositivo ficar offline.</small></div><input type="checkbox" checked={form.disconnectAlerts} onChange={e => setForm({...form, disconnectAlerts: e.target.checked})}/></label>
        </div>}
        {formError && <p className="inline-error" style={{ margin: "0 25px" }}>{formError}</p>}
        <div className="form-footer"><Button variant="secondary" onClick={() => step === 1 ? navigate("devices") : setStep(1)}>Voltar</Button><Button disabled={submitting} onClick={() => step === 1 ? goToStep2() : submit()}>{submitting ? "Enviando..." : step === 1 ? "Continuar" : "Cadastrar dispositivo"}<Icon name={step === 1 ? "arrow" : "check"} size={17}/></Button></div>
      </section> : <section className="card success-card"><div><Icon name="check" size={34}/></div><h2>Dispositivo adicionado!</h2><p><b>{form.name}</b> foi conectado à plataforma e já está pronto para transmitir dados.</p><Button onClick={() => navigate("devices")}>Ver meus dispositivos <Icon name="arrow" size={16}/></Button></section>}
      {step < 3 && <div className="help-card"><Icon name="wifi"/><div><b>Não encontrou o código?</b><p>Certifique-se de que seu dispositivo está ligado e conectado à mesma rede Wi-Fi. <a>Consulte o guia de instalação.</a></p></div></div>}
    </main>
  </div>;
}

function Step({ n, label, active }: { n: number; label: string; active: boolean }) { return <div className={active ? "active" : ""}><span>{active ? <Icon name="check" size={14}/> : n}</span><b>{label}</b></div>; }

function Alerts({ onChanged }: { onChanged: () => void }) {
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [data, setData] = useState<Awaited<ReturnType<typeof api.alerts>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.alerts(onlyUnread).then(setData).catch((e) => setError(e instanceof ApiError ? e.message : "Não foi possível carregar os alertas."));
  };

  useEffect(load, [onlyUnread]);

  const markAllRead = async () => {
    setBusy(true);
    try {
      await api.markAllAlertsRead();
      load();
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível atualizar os alertas.");
    } finally {
      setBusy(false);
    }
  };

  return <div><Header title="Central de alertas" eyebrow="MONITORAMENTO" onMenu={() => {}}/>
    <main className="page-content">
      <section className="welcome-row"><p>Acompanhe ocorrências e atualizações dos seus dispositivos.</p><Button variant="secondary" disabled={busy} onClick={markAllRead}><Icon name="check" size={17}/>Marcar todos como lidos</Button></section>
      {error ? <StateNotice text={error}/> : !data ? <StateNotice text="Carregando alertas..."/> : <>
        <div className="alert-summary">
          <div className="active"><span className="alert-icon high"><Icon name="bell"/></span><div><strong>{data.summary.unread}</strong><small>Não lidos</small></div></div>
          <div><span className="alert-icon high"><Icon name="droplet"/></span><div><strong>{data.summary.highPriority}</strong><small>Alta prioridade</small></div></div>
          <div><span className="alert-icon medium"><Icon name="activity"/></span><div><strong>{data.summary.attention}</strong><small>Atenção</small></div></div>
          <div><span className="alert-icon low"><Icon name="check"/></span><div><strong>{data.summary.resolvedThisMonth}</strong><small>Resolvidos este mês</small></div></div>
        </div>
        <section className="card alerts-page-card">
          <div className="alerts-toolbar"><div className="filter-tabs"><button className={!onlyUnread ? "active" : ""} onClick={() => setOnlyUnread(false)}>Todos</button><button className={onlyUnread ? "active" : ""} onClick={() => setOnlyUnread(true)}>Não lidos</button></div><button className="select-btn"><Icon name="filter" size={15}/>Todas as prioridades<Icon name="chevron" size={13} className="rotate-90"/></button></div>
          <div className="full-alert-list">{data.items.length ? data.items.map((a) => <div key={a.id} className={`full-alert ${!a.read ? "unread" : ""}`}>
            <span className={`alert-icon ${a.level}`}><Icon name={a.level === "high" ? "droplet" : a.level === "medium" ? "wifi" : "check"} size={19}/></span>
            <div className="full-alert-copy"><div><strong>{a.title}</strong>{!a.read && <i>Novo</i>}</div><p>{a.message}</p><small><Icon name="cpu" size={13}/>{a.deviceName ?? "—"}<span>•</span><Icon name="clock" size={13}/>{relativeTime(a.createdAt)}</small></div>
            <button className="icon-btn"><Icon name="more" size={18}/></button>
          </div>) : <div className="empty-state"><Icon name="check" size={30}/><b>Tudo em dia</b><p>Você não tem alertas não lidos.</p></div>}</div>
        </section>
      </>}
    </main>
  </div>;
}

function Settings() {
  const { refreshProfile } = useContext(ProfileContext);
  const [tab, setTab] = useState<"profile" | "notifications" | "appearance">("profile");
  const [form, setForm] = useState<SettingsData | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.settings().then(setForm).catch((e) => setError(e instanceof ApiError ? e.message : "Não foi possível carregar as configurações."));
  }, []);

  const save = async () => {
    if (!form) return;
    if (!form.fullName.trim()) { setError("Informe seu nome completo."); return; }
    setSaving(true); setError(null);
    try {
      const updated = await api.updateSettings(form);
      setForm(updated);
      refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  };

  return <div><Header title="Configurações" eyebrow="SUA CONTA" onMenu={() => {}}/>
    <main className="page-content">
      <section className="settings-layout">
        <aside className="settings-nav card">
          <button className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}><Icon name="user"/>Perfil e conta<Icon name="chevron" size={15}/></button>
          <button className={tab === "notifications" ? "active" : ""} onClick={() => setTab("notifications")}><Icon name="bell"/>Notificações<Icon name="chevron" size={15}/></button>
          <button className={tab === "appearance" ? "active" : ""} onClick={() => setTab("appearance")}><Icon name="palette"/>Preferências<Icon name="chevron" size={15}/></button>
          <button><Icon name="shield"/>Segurança<Icon name="chevron" size={15}/></button>
          <hr/><button className="logout"><Icon name="logout"/>Sair da conta</button>
        </aside>
        <section className="card settings-panel">
          {!form ? <StateNotice text={error ?? "Carregando configurações..."}/> : <>
          {tab === "profile" && <><div className="panel-heading"><h2>Perfil e conta</h2><p>Gerencie suas informações pessoais e da propriedade.</p></div>
            <div className="profile-photo"><div className="avatar large">{form.fullName.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase()}</div><div><Button variant="secondary">Alterar foto</Button><p>JPG ou PNG. Máximo de 2 MB.</p></div></div>
            <div className="form-grid settings-form"><label><span>Nome completo</span><input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})}/></label><label><span>E-mail</span><input value={form.email} onChange={e => setForm({...form, email: e.target.value})}/></label><label><span>Telefone</span><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}/></label><label><span>Função</span><select value={form.role} onChange={e => setForm({...form, role: e.target.value})}><option>Administradora</option><option>Operadora</option></select></label><label className="full"><span>Nome da propriedade</span><input value={form.propertyName} onChange={e => setForm({...form, propertyName: e.target.value})}/></label><label className="full"><span>Localização</span><input value={form.propertyLocation} onChange={e => setForm({...form, propertyLocation: e.target.value})}/></label></div>
          </>}
          {tab === "notifications" && <><div className="panel-heading"><h2>Notificações</h2><p>Escolha como e quando você deseja ser avisada.</p></div><div className="preference-list">
            <Toggle title="Alertas críticos" text="Baixa umidade, reservatório vazio e falha do dispositivo" checked={form.notifyCritical} onChange={v => setForm({...form, notifyCritical: v})}/>
            <Toggle title="Dispositivo offline" text="Quando um equipamento ficar desconectado por mais de 30 minutos" checked={form.notifyOffline} onChange={v => setForm({...form, notifyOffline: v})}/>
            <Toggle title="Rotinas concluídas" text="Confirmação após cada ciclo automático de irrigação" checked={form.notifyRoutines} onChange={v => setForm({...form, notifyRoutines: v})}/>
            <Toggle title="Resumo semanal" text="Relatório de consumo e desempenho enviado por e-mail" checked={form.notifyWeekly} onChange={v => setForm({...form, notifyWeekly: v})}/>
          </div></>}
          {tab === "appearance" && <><div className="panel-heading"><h2>Preferências da plataforma</h2><p>Personalize sua experiência e os formatos dos dados.</p></div><div className="form-grid settings-form"><label><span>Idioma</span><select value={form.language} onChange={e => setForm({...form, language: e.target.value})}><option value="pt-BR">Português (Brasil)</option></select></label><label><span>Fuso horário</span><select value={form.timezone} onChange={e => setForm({...form, timezone: e.target.value})}><option value="America/Sao_Paulo">Brasília (GMT-3)</option></select></label><label><span>Unidade de temperatura</span><select value={form.temperatureUnit} onChange={e => setForm({...form, temperatureUnit: e.target.value})}><option value="C">Celsius (°C)</option><option value="F">Fahrenheit (°F)</option></select></label><label><span>Formato de data</span><select value={form.dateFormat} onChange={e => setForm({...form, dateFormat: e.target.value})}><option value="DD/MM/AAAA">DD/MM/AAAA</option></select></label></div></>}
          {error && <p className="inline-error" style={{ margin: "0 25px" }}>{error}</p>}
          <div className="settings-footer"><span className={saved ? "save-confirm show" : "save-confirm"}><Icon name="check" size={15}/>Alterações salvas</span><Button disabled={saving} onClick={save}>{saving ? "Salvando..." : "Salvar alterações"}</Button></div>
          </>}
        </section>
      </section>
    </main>
  </div>;
}

function Toggle({ title, text, checked, onChange }: { title: string; text: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <div className="toggle-row"><div><b>{title}</b><p>{text}</p></div><button className={`switch ${checked ? "on" : ""}`} onClick={() => onChange(!checked)}><i/></button></div>;
}

export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  useMemo(() => navItems.find(n => n.id === page)?.label || "", [page]);

  const navigate = (p: Page) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openDevice = (id: string) => { setSelectedDeviceId(id); navigate("device"); };

  const refreshProfile = () => {
    api.settings().then((s) => setProfile({ fullName: s.fullName, email: s.email, role: s.role, propertyName: s.propertyName, propertyLocation: s.propertyLocation })).catch(() => {});
  };
  useEffect(() => { refreshProfile(); }, []);

  useEffect(() => {
    let alive = true;
    api.alerts(true).then((r) => alive && setUnreadAlerts(r.summary.unread)).catch(() => {});
    return () => { alive = false; };
  }, [page]);

  const pageNode = page === "dashboard" ? <Dashboard navigate={navigate} openDevice={openDevice}/> :
    page === "devices" ? <Devices openDevice={openDevice} navigate={navigate}/> :
    page === "device" ? <DeviceDetail deviceId={selectedDeviceId} navigate={navigate}/> :
    page === "add" ? <AddDevice navigate={navigate}/> :
    page === "alerts" ? <Alerts onChanged={() => setUnreadAlerts(0)}/> : <Settings/>;

  return <ProfileContext.Provider value={{ profile, refreshProfile, navigate }}>
    <div className="app-shell">
      <Sidebar page={page} setPage={navigate} open={sidebarOpen} close={() => setSidebarOpen(false)} unreadAlerts={unreadAlerts}/>
      <div className="main-shell">
        {pageNode}
        <button className="mobile-menu-trigger lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Icon name="menu"/></button>
      </div>
    </div>
  </ProfileContext.Provider>;
}
