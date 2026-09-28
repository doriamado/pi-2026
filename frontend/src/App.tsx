import { useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, relativeTime, type AlertItem, type DeviceDetail, type DeviceSummary, type Settings as SettingsData } from "./api";

type Page = "dashboard" | "devices" | "device" | "add" | "alerts" | "settings";

const navItems: { id: Page; label: string; icon: IconName }[] = [
  { id: "dashboard", label: "Visão geral", icon: "grid" },
  { id: "devices", label: "Meus dispositivos", icon: "cpu" },
  { id: "alerts", label: "Alertas", icon: "bell" },
  { id: "settings", label: "Configurações", icon: "settings" },
];

type IconName = "grid" | "cpu" | "bell" | "settings" | "droplet" | "thermometer" | "waves" | "sprout" | "plus" | "search" | "chevron" | "arrow" | "clock" | "activity" | "map" | "more" | "wifi" | "user" | "shield" | "palette" | "logout" | "menu" | "close" | "check" | "zap" | "calendar" | "filter";

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

function Header({ title, eyebrow, onMenu }: { title: string; eyebrow?: string; onMenu: () => void }) {
  return <header className="page-header">
    <button className="icon-btn lg:hidden" onClick={onMenu}><Icon name="menu" /></button>
    <div className="min-w-0">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1>{title}</h1>
    </div>
    <div className="ml-auto flex items-center gap-2 sm:gap-3">
      <button className="icon-btn relative" aria-label="Notificações"><Icon name="bell" size={19}/><span className="notification-dot" /></button>
      <div className="header-user">
        <div className="avatar">MC</div>
        <div className="hidden sm:block"><strong>Marina Costa</strong><span>Administradora</span></div>
        <Icon name="chevron" size={14} className="hidden sm:block rotate-90 text-slate-400"/>
      </div>
    </div>
  </header>;
}

function Sidebar({ page, setPage, open, close, unreadAlerts }: { page: Page; setPage: (p: Page) => void; open: boolean; close: () => void; unreadAlerts: number }) {
  return <>
    {open && <div className="sidebar-scrim lg:hidden" onClick={close}/>}
    <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
      <div className="brand">
        <div className="brand-mark"><Icon name="sprout" size={24}/><span /></div>
        <div><b>Verda</b><small>IoT Irrigação</small></div>
        <button onClick={close} className="ml-auto text-white/70 lg:hidden"><Icon name="close" /></button>
      </div>
      <div className="farm-chip"><span className="farm-avatar">FS</span><div><small>PROPRIEDADE</small><b>Fazenda Santa Luzia</b></div><Icon name="chevron" size={15} className="ml-auto rotate-90"/></div>
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
      <div className="sidebar-footer">
        <div className="avatar">MC</div><div><b>Marina Costa</b><span>marina@fazenda.com</span></div><Icon name="more" size={18}/>
      </div>
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
    <div className="device-top"><div className="device-symbol"><Icon name="cpu"/></div><Status status={device.status}/><Icon name="more" size={18} className="ml-auto text-slate-400"/></div>
    <h3>{device.name}</h3><p><Icon name="map" size={14}/>{device.location}</p>
    <div className="device-stats"><span><Icon name="droplet" size={15}/><b>{device.moisture == null ? "—" : `${device.moisture.toFixed(0)}%`}</b><small>Umidade</small></span><span><Icon name="thermometer" size={15}/><b>{device.temperature == null ? "—" : `${device.temperature.toFixed(1)}°`}</b><small>Temperatura</small></span><span><Icon name="waves" size={15}/><b>{device.water == null ? "—" : `${device.water.toFixed(0)}%`}</b><small>Água</small></span></div>
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

function DeviceDetail({ deviceId, navigate }: { deviceId: string | null; navigate: (p: Page) => void }) {
  const [detail, setDetail] = useState<DeviceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<"24 horas" | "7 dias">("24 horas");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!deviceId) return;
    let alive = true;
    setDetail(null);
    api.device(deviceId, period === "24 horas" ? 1 : 7).then((d) => alive && setDetail(d)).catch((e) => alive && setError(e instanceof ApiError ? e.message : "Não foi possível carregar o dispositivo."));
    return () => { alive = false; };
  }, [deviceId, period]);

  if (!deviceId) return <div><Header title="Dispositivo" onMenu={() => {}}/><main className="page-content"><StateNotice text="Selecione um dispositivo na lista para ver os detalhes."/><Button variant="secondary" className="mt-3" onClick={() => navigate("devices")}>Ver meus dispositivos</Button></main></div>;
  if (error) return <div><Header title="Dispositivo" onMenu={() => {}}/><main className="page-content"><StateNotice text={error}/></main></div>;
  if (!detail) return <div><Header title="Dispositivo" onMenu={() => {}}/><main className="page-content"><StateNotice text="Carregando dispositivo..."/></main></div>;

  const toggleIrrigation = async () => {
    setBusy(true); setActionError(null);
    try {
      const updated = detail.irrigating ? await api.stopIrrigation(detail.id) : await api.startIrrigation(detail.id);
      setDetail(updated);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Não foi possível atualizar a irrigação.");
    } finally {
      setBusy(false);
    }
  };

  const moisturePoints = seriesToPoints(detail.series, 700, 200, detail.moisture ?? 55);
  const tempPct = detail.temperature == null ? 0 : Math.max(0, Math.min(100, (detail.temperature / 45) * 100));

  return <div><Header title={detail.name} eyebrow="DETALHES DO DISPOSITIVO" onMenu={() => {}}/>
    <main className="page-content">
      <button className="back-link" onClick={() => navigate("devices")}><span>‹</span> Voltar aos dispositivos</button>
      <section className="device-hero card">
        <div className="hero-device-icon"><Icon name="cpu" size={30}/><i/></div>
        <div><div className="flex items-center gap-3"><h2>{detail.name}</h2><Status status={detail.status}/></div><p>{detail.id} <span>•</span> {detail.type} <span>•</span> {detail.location}</p><small><Icon name="clock" size={13}/> Última atualização {relativeTime(detail.lastSeenAt).toLowerCase()}</small></div>
        <div className="hero-actions"><Button variant="secondary" onClick={() => navigate("settings")}><Icon name="settings" size={17}/>Configurar</Button><button className="icon-btn"><Icon name="more"/></button></div>
      </section>
      <section className="detail-metrics">
        <DetailMetric icon="droplet" tone="cyan" label="Umidade do solo" value={detail.moisture == null ? "—" : `${detail.moisture.toFixed(0)}%`} state={detail.status === "alerta" ? "Abaixo do limite" : "Ideal"} progress={detail.moisture ?? 0}/>
        <DetailMetric icon="thermometer" tone="amber" label="Temperatura" value={detail.temperature == null ? "—" : `${detail.temperature.toFixed(1)}°C`} state="Normal" progress={tempPct}/>
        <DetailMetric icon="waves" tone="blue" label="Nível de água" value={detail.water == null ? "—" : `${detail.water.toFixed(0)}%`} state={detail.water != null && detail.water < 40 ? "Baixo" : "Bom"} progress={detail.water ?? 0}/>
        <DetailMetric icon="activity" tone="green" label="Irrigação" value={detail.irrigating ? "Ativa" : "Desligada"} state={detail.irrigating ? "Manual" : `Próxima: ${detail.scheduleTime?.slice(0,5) ?? "—"}`} progress={detail.irrigating ? 100 : 0}/>
      </section>
      <section className="detail-layout">
        <div className="card history-card">
          <div className="card-heading"><div><h2>Histórico de umidade</h2><p>Leituras do sensor ao longo do tempo</p></div><button className="select-btn" onClick={() => setPeriod(period === "24 horas" ? "7 dias" : "24 horas")}><Icon name="calendar" size={15}/>{period}<Icon name="chevron" size={13} className="rotate-90"/></button></div>
          <div className="detail-chart">
            <div className="threshold-label">Faixa ideal 55–75%</div>
            <span className="ideal-band"/>
            <svg viewBox="0 0 700 200" preserveAspectRatio="none"><defs><linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#089e77" stopOpacity=".23"/><stop offset="1" stopColor="#089e77" stopOpacity="0"/></linearGradient></defs><polygon points={`${moisturePoints} 700,200 0,200`} fill="url(#detailFill)"/><polyline points={moisturePoints} fill="none" stroke="#079975" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg>
            <div className="chart-hours"><span>{period === "24 horas" ? "00h" : "7 dias"}</span><span>{period === "24 horas" ? "08h" : "atrás"}</span><span></span><span>{period === "24 horas" ? "16h" : ""}</span><span></span><span></span><span>Agora</span></div>
          </div>
        </div>
        <div className="card manual-card">
          <div className={`manual-visual ${detail.irrigating ? "running" : ""}`}><span><Icon name={detail.irrigating ? "droplet" : "zap"} size={30}/></span><i/><i/><i/></div>
          <h2>Controle manual</h2><p>{detail.irrigating ? "Irrigação em andamento. Você pode interromper a qualquer momento." : "Acione a irrigação imediatamente, independentemente da programação."}</p>
          <div className="duration-row"><span>Duração</span><b>{detail.irrigating ? `${detail.irrigationMinutes} minutos` : `${detail.defaultDurationMin} minutos`}</b></div>
          {actionError && <p style={{ color: "#d85344", fontSize: "9px", margin: "0 0 10px" }}>{actionError}</p>}
          <Button variant={detail.irrigating ? "danger" : "primary"} className="w-full" onClick={toggleIrrigation} disabled={busy}><Icon name={detail.irrigating ? "close" : "droplet"} size={17}/>{busy ? "Aguarde..." : detail.irrigating ? "Interromper irrigação" : "Iniciar irrigação"}</Button>
          <small><Icon name="shield" size={13}/> Desligamento automático ativado</small>
        </div>
      </section>
      <section className="card info-table"><div className="card-heading"><div><h2>Informações do dispositivo</h2><p>Dados técnicos e conectividade</p></div></div><div className="info-grid"><Info label="Identificação" value={detail.id}/><Info label="Modelo" value={`Verda ${detail.type}`}/><Info label="Firmware" value={detail.firmware}/><Info label="Conectividade" value={detail.connectivity}/><Info label="Instalado em" value={formatDatePt(detail.installedAt)}/><Info label="Próxima rotina" value={formatScheduleLabel(detail.scheduleTime)}/></div></section>
    </main>
  </div>;
}

function DetailMetric({ icon, tone, label, value, state, progress }: { icon: IconName; tone: string; label: string; value: string; state: string; progress: number }) {
  return <div className="card detail-metric"><div className={`metric-icon ${tone}`}><Icon name={icon}/></div><span>{label}</span><strong>{value}</strong><div className="metric-progress"><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}/></div><small>{state}</small></div>;
}

function Info({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b>{value}</b></div>; }

type AddForm = { name: string; type: string; id: string; location: string; minMoisture: string; defaultDurationMin: string; autoIrrigation: boolean; disconnectAlerts: boolean };

function AddDevice({ navigate }: { navigate: (p: Page) => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AddForm>({ name: "", type: "Irrigador Pro", id: "", location: "", minMoisture: "40", defaultDurationMin: "15", autoIrrigation: true, disconnectAlerts: true });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async () => {
    if (!form.name || !form.id) return;
    setSubmitting(true); setFormError(null);
    try {
      const created = await api.createDevice({ name: form.name, type: form.type, id: form.id, location: form.location });
      const minMoisture = Number(form.minMoisture) || 40;
      const defaultDurationMin = Number(form.defaultDurationMin) || 15;
      if (minMoisture !== 40 || defaultDurationMin !== 15 || !form.autoIrrigation || !form.disconnectAlerts) {
        await api.updateDeviceSettings(created.id, { minMoisture, defaultDurationMin, autoIrrigation: form.autoIrrigation, disconnectAlerts: form.disconnectAlerts });
      }
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
      <div className="stepper"><Step n={1} label="Identificação" active={step >= 1}/><i className={step >= 2 ? "done" : ""}/><Step n={2} label="Configuração" active={step >= 2}/><i className={step >= 3 ? "done" : ""}/><Step n={3} label="Concluir" active={step >= 3}/></div>
      {step < 3 ? <section className="card form-card">
        <div className="form-heading"><div className="form-icon"><Icon name={step === 1 ? "cpu" : "settings"} size={25}/></div><div><h2>{step === 1 ? "Identifique seu dispositivo" : "Preferências de irrigação"}</h2><p>{step === 1 ? "Insira os dados encontrados na etiqueta do seu Arduino." : "Defina os parâmetros iniciais. Você poderá alterá-los depois."}</p></div></div>
        {step === 1 ? <div className="form-grid">
          <label><span>Nome do dispositivo</span><input placeholder="Ex.: Horta principal" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/><small>Use um nome fácil de reconhecer.</small></label>
          <label><span>Tipo de dispositivo</span><select value={form.type} onChange={e => setForm({...form, type:e.target.value})}><option>Irrigador Pro</option><option>Irrigador Mini</option><option>Sensor de reservatório</option></select></label>
          <label className="full"><span>Código de identificação</span><div className="input-prefix"><Icon name="cpu" size={17}/><input placeholder="ARD-IRR-0000" value={form.id} onChange={e => setForm({...form, id:e.target.value.toUpperCase()})}/></div><small>O código está impresso na parte inferior do dispositivo.</small></label>
          <label className="full"><span>Localização</span><div className="input-prefix"><Icon name="map" size={17}/><input placeholder="Ex.: Estufa 01, Setor B" value={form.location} onChange={e => setForm({...form, location:e.target.value})}/></div></label>
        </div> : <div className="form-grid">
          <label><span>Limite mínimo de umidade</span><div className="unit-input"><input type="number" value={form.minMoisture} onChange={e => setForm({...form, minMoisture: e.target.value})}/><b>%</b></div><small>Um alerta será enviado abaixo deste valor.</small></label>
          <label><span>Duração padrão</span><div className="unit-input"><input type="number" value={form.defaultDurationMin} onChange={e => setForm({...form, defaultDurationMin: e.target.value})}/><b>min</b></div></label>
          <label className="full toggle-option"><div><span>Irrigação automática</span><small>Ativar quando a umidade estiver abaixo do limite.</small></div><input type="checkbox" checked={form.autoIrrigation} onChange={e => setForm({...form, autoIrrigation: e.target.checked})}/></label>
          <label className="full toggle-option"><div><span>Alertas de desconexão</span><small>Notificar quando o dispositivo ficar offline.</small></div><input type="checkbox" checked={form.disconnectAlerts} onChange={e => setForm({...form, disconnectAlerts: e.target.checked})}/></label>
        </div>}
        {formError && <p style={{ color: "#d85344", fontSize: "9px", margin: "0 25px" }}>{formError}</p>}
        <div className="form-footer"><Button variant="secondary" onClick={() => step === 1 ? navigate("devices") : setStep(1)}>Voltar</Button><Button disabled={submitting} onClick={() => step === 1 ? setStep(2) : submit()}>{submitting ? "Enviando..." : step === 1 ? "Continuar" : "Cadastrar dispositivo"}<Icon name={step === 1 ? "arrow" : "check"} size={17}/></Button></div>
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
    setSaving(true); setError(null);
    try {
      const updated = await api.updateSettings(form);
      setForm(updated);
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
          {error && <p style={{ color: "#d85344", fontSize: "9px", margin: "0 25px" }}>{error}</p>}
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
  useMemo(() => navItems.find(n => n.id === page)?.label || "", [page]);

  const navigate = (p: Page) => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const openDevice = (id: string) => { setSelectedDeviceId(id); navigate("device"); };

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

  return <div className="app-shell">
    <Sidebar page={page} setPage={navigate} open={sidebarOpen} close={() => setSidebarOpen(false)} unreadAlerts={unreadAlerts}/>
    <div className="main-shell">
      {pageNode}
      <button className="mobile-menu-trigger lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Icon name="menu"/></button>
    </div>
  </div>;
}
