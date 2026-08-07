import type { Sensor } from "../types";

const tipoLabel: Record<Sensor["tipo"], string> = {
  UMIDADE_SOLO: "Umidade do Solo",
  TEMPERATURA: "Temperatura",
  NIVEL_RESERVATORIO: "Nível do Reservatório",
};

export default function SensorCard({ sensor, ultimoValor }: { sensor: Sensor; ultimoValor?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{tipoLabel[sensor.tipo]}</h3>
        <span className={`h-2 w-2 rounded-full ${sensor.online ? "bg-emerald-500" : "bg-gray-300"}`} />
      </div>
      <p className="mt-2 text-2xl font-semibold text-gray-900">{ultimoValor ?? "—"}</p>
      <p className="mt-1 text-xs text-gray-400">{sensor.online ? "Online" : "Offline"}</p>
    </div>
  );
}
