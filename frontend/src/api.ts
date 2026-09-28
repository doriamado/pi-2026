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
  lastSeenAt: string | null;
};

export type SeriesPoint = { t: string; moisture: number | null; temperature: number | null; water: number | null };

export type DeviceDetail = DeviceSummary & {
  firmware: string;
  connectivity: string;
  installedAt: string | null;
  minMoisture: number;
  defaultDurationMin: number;
  autoIrrigation: boolean;
  disconnectAlerts: boolean;
  scheduleTime: string | null;
  irrigating: boolean;
  irrigationMinutes: number;
  irrigationMode: string | null;
  series: SeriesPoint[];
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

export type DashboardResponse = {
  greetingName: string;
  deviceCounts: DeviceCounts;
  avgMoisture: number | null;
  avgMoistureDeltaPercent: number | null;
  avgWaterLevel: number | null;
  activeAlerts: number;
  highPriorityAlerts: number;
  moistureSeries: SeriesPoint[];
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

export const api = {
  dashboard: () => request<DashboardResponse>("/api/dashboard"),
  devices: () => request<DeviceSummary[]>("/api/devices"),
  device: (id: string, days: 1 | 7 = 1) => request<DeviceDetail>(`/api/devices/${id}?days=${days}`),
  createDevice: (data: { name: string; type: string; id: string; location: string }) =>
    request<DeviceSummary>("/api/devices", { method: "POST", body: JSON.stringify(data) }),
  updateDeviceSettings: (
    id: string,
    data: { minMoisture: number; defaultDurationMin: number; autoIrrigation: boolean; disconnectAlerts: boolean },
  ) => request<DeviceDetail>(`/api/devices/${id}/settings`, { method: "PATCH", body: JSON.stringify(data) }),
  startIrrigation: (id: string, minutes?: number) =>
    request<DeviceDetail>(`/api/devices/${id}/irrigation/start`, {
      method: "POST",
      body: minutes ? JSON.stringify({ minutes }) : undefined,
    }),
  stopIrrigation: (id: string) => request<DeviceDetail>(`/api/devices/${id}/irrigation/stop`, { method: "POST" }),
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
