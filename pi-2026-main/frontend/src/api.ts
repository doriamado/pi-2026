// Cliente da API da Plataforma Verda. Endereço configurável via VITE_API_URL
// (por padrão aponta para o backend Spring Boot rodando em localhost:8080).
const BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8080";

export type DeviceStatus = "online" | "offline" | "alerta";

export type DeviceSummary = {
  id: string;
  name: string;
  location: string;
  type: string;
  status: DeviceStatus;
  moisture: number | null;
  temperature: number | null;
  water: number | null;
  ph: number | null;
  crop: string;
  irrigating: boolean;
  lastSeenAt: string | null;
};

export type SeriesPoint = { t: string; moisture: number | null; temperature: number | null; water: number | null; ph: number | null };

export type RegimeKey = "garoa" | "leve" | "moderada" | "forte";

export type Regime = { key: RegimeKey; label: string; description: string; pumpPower: number; mmPerHour: number };

export type Schedule = {
  id: number;
  deviceId: string;
  name: string;
  days: number[];
  startTime: string;
  durationMin: number;
  regime: RegimeKey;
  estimatedMm: number;
  enabled: boolean;
  nextRunAt: string | null;
};

export type IrrigationLogItem = {
  id: number;
  deviceId: string;
  deviceName: string;
  startedAt: string;
  endedAt: string | null;
  plannedMinutes: number;
  actualMinutes: number;
  running: boolean;
  mode: "manual" | "agendada";
  regime: RegimeKey;
  scheduleName: string | null;
  estimatedMm: number;
};

export type DeviceDetail = DeviceSummary & {
  firmware: string;
  connectivity: string;
  installedAt: string | null;
  minMoisture: number;
  minPh: number;
  maxPh: number;
  defaultDurationMin: number;
  defaultRegime: RegimeKey;
  autoIrrigation: boolean;
  disconnectAlerts: boolean;
  scheduleTime: string | null;
  irrigationMinutes: number;
  irrigationMode: string | null;
  irrigationRegime: RegimeKey | null;
  irrigatingUntil: string | null;
  series: SeriesPoint[];
  schedules: Schedule[];
  history: IrrigationLogItem[];
};

export type AlertItem = {
  id: number;
  deviceId: string;
  deviceName: string | null;
  kind: string;
  level: "high" | "medium" | "low";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export type AlertsSummary = { unread: number; highPriority: number; attention: number; resolvedThisMonth: number };
export type AlertsResponse = { items: AlertItem[]; summary: AlertsSummary };

export type DeviceCounts = { total: number; online: number; offline: number; alerta: number };

export type DailyIrrigation = { date: string; runs: number; minutes: number; mm: number };
export type UpcomingRun = { scheduleId: number; scheduleName: string; deviceId: string; deviceName: string; runAt: string; durationMin: number; regime: RegimeKey };

export type DashboardResponse = {
  greetingName: string;
  deviceCounts: DeviceCounts;
  avgMoisture: number | null;
  avgMoistureDeltaPercent: number | null;
  avgWaterLevel: number | null;
  avgPh: number | null;
  avgTemperature: number | null;
  activeAlerts: number;
  highPriorityAlerts: number;
  irrigatingNow: number;
  irrigationsToday: number;
  waterMmToday: number;
  moistureSeries: SeriesPoint[];
  weeklyIrrigation: DailyIrrigation[];
  upcomingRuns: UpcomingRun[];
  recentAlerts: AlertItem[];
  devices: DeviceSummary[];
};

export type Settings = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  propertyName: string;
  propertyLocation: string;
  notifyCritical: boolean;
  notifyOffline: boolean;
  notifyRoutines: boolean;
  notifyWeekly: boolean;
  language: string;
  timezone: string;
  temperatureUnit: string;
  dateFormat: string;
};

export class ApiError extends Error {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique se o backend está em execução.");
  }
  if (!response.ok) {
    let message = `Erro ${response.status} ao comunicar com o servidor.`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      /* corpo vazio ou não-JSON: mantém a mensagem padrão */
    }
    throw new ApiError(message);
  }
  if (response.status === 204 || response.status === 202) return undefined as T;
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export type CreateDevicePayload = {
  name: string;
  type: string;
  id: string;
  location: string;
  crop?: string;
  connectivity?: string;
  minMoisture?: number;
  defaultDurationMin?: number;
  autoIrrigation?: boolean;
  disconnectAlerts?: boolean;
  minPh?: number;
  maxPh?: number;
  defaultRegime?: RegimeKey;
};

export type DeviceSettingsPayload = {
  minMoisture: number;
  defaultDurationMin: number;
  autoIrrigation: boolean;
  disconnectAlerts: boolean;
  minPh?: number;
  maxPh?: number;
  defaultRegime?: RegimeKey;
};

export type SchedulePayload = { name: string; days: number[]; startTime: string; durationMin: number; regime: RegimeKey; enabled?: boolean };

export const api = {
  dashboard: () => request<DashboardResponse>("/api/dashboard"),
  devices: () => request<DeviceSummary[]>("/api/devices"),
  device: (id: string, days: 1 | 7 | 30 = 1) => request<DeviceDetail>(`/api/devices/${id}?days=${days}`),
  createDevice: (data: CreateDevicePayload) =>
    request<DeviceSummary>("/api/devices", { method: "POST", body: JSON.stringify(data) }),
  updateDeviceProfile: (id: string, data: { name: string; type: string; location: string; crop?: string; connectivity?: string }) =>
    request<DeviceDetail>(`/api/devices/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDevice: (id: string) => request<void>(`/api/devices/${id}`, { method: "DELETE" }),
  updateDeviceSettings: (id: string, data: DeviceSettingsPayload) =>
    request<DeviceDetail>(`/api/devices/${id}/settings`, { method: "PATCH", body: JSON.stringify(data) }),
  startIrrigation: (id: string, minutes?: number, regime?: RegimeKey) =>
    request<DeviceDetail>(`/api/devices/${id}/irrigation/start`, {
      method: "POST",
      body: minutes || regime ? JSON.stringify({ minutes, regime }) : undefined,
    }),
  stopIrrigation: (id: string) => request<DeviceDetail>(`/api/devices/${id}/irrigation/stop`, { method: "POST" }),

  regimes: () => request<Regime[]>("/api/regimes"),
  irrigations: (days = 7) => request<IrrigationLogItem[]>(`/api/irrigations?days=${days}`),

  schedules: (deviceId: string) => request<Schedule[]>(`/api/devices/${deviceId}/schedules`),
  createSchedule: (deviceId: string, data: SchedulePayload) =>
    request<Schedule>(`/api/devices/${deviceId}/schedules`, { method: "POST", body: JSON.stringify(data) }),
  updateSchedule: (deviceId: string, scheduleId: number, data: SchedulePayload) =>
    request<Schedule>(`/api/devices/${deviceId}/schedules/${scheduleId}`, { method: "PUT", body: JSON.stringify(data) }),
  toggleSchedule: (deviceId: string, scheduleId: number, enabled: boolean) =>
    request<Schedule>(`/api/devices/${deviceId}/schedules/${scheduleId}`, { method: "PATCH", body: JSON.stringify({ enabled }) }),
  deleteSchedule: (deviceId: string, scheduleId: number) =>
    request<void>(`/api/devices/${deviceId}/schedules/${scheduleId}`, { method: "DELETE" }),

  alerts: (onlyUnread: boolean) => request<AlertsResponse>(`/api/alerts?onlyUnread=${onlyUnread}`),
  markAlertRead: (id: number) => request<void>(`/api/alerts/${id}/read`, { method: "POST" }),
  markAllAlertsRead: () => request<void>("/api/alerts/read-all", { method: "POST" }),
  settings: () => request<Settings>("/api/settings"),
  updateSettings: (data: Settings) => request<Settings>("/api/settings", { method: "PUT", body: JSON.stringify(data) }),
};

/** Formata um timestamp ISO como "Agora", "há 2 min", "há 3 h" — no mesmo estilo usado nos textos originais. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Sem dados";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "Agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} d`;
}

export const WEEKDAY_SHORT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

/** Formata um horário "próxima execução" ISO como "Hoje às 18:00" / "Amanhã às 06:30" / "Seg às 07:00". */
export function formatRunAt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const hhmm = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Hoje às ${hhmm}`;
  if (isTomorrow) return `Amanhã às ${hhmm}`;
  return `${WEEKDAY_SHORT[(d.getDay() + 6) % 7]} às ${hhmm}`;
}
