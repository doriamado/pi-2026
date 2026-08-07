export interface Device {
  id: string;
  nome: string;
  tipo: "ESP32" | "MOCK_DEVICE";
  status: "ONLINE" | "OFFLINE" | "DESCONHECIDO";
  origem: "MOCK" | "REAL";
  ultimaComunicacao?: string;
}

export interface Sensor {
  id: string;
  deviceId: string;
  nome: string;
  tipo: "UMIDADE_SOLO" | "TEMPERATURA" | "NIVEL_RESERVATORIO";
  online: boolean;
}

export interface AlertItem {
  id: string;
  deviceId: string;
  origem: string;
  mensagem: string;
  severidade: "BAIXA" | "MEDIA" | "ALTA" | "CRITICA";
  status: "ABERTO" | "RESOLVIDO";
  timestamp: string;
}

export interface AutomationRule {
  id: string;
  deviceId: string;
  sensorUmidadeId: string;
  sensorReservatorioId: string;
  atuadorId: string;
  limiarUmidadeMinimo: number;
  limiarReservatorioMinimo: number;
  duracaoSegundos: number;
  ativa: boolean;
}

export interface DashboardSummary {
  dispositivosAtivos: number;
  sensoresOnline: number;
  irrigacoesEmAndamento: number;
  alertasAbertos: number;
}
