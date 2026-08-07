import type { Device } from "../types";

const statusColor: Record<Device["status"], string> = {
  ONLINE: "bg-emerald-100 text-emerald-700",
  OFFLINE: "bg-red-100 text-red-700",
  DESCONHECIDO: "bg-gray-100 text-gray-600",
};

export default function DeviceCard({ device }: { device: Device }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">{device.nome}</h3>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[device.status]}`}>
          {device.status}
        </span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        {device.tipo === "MOCK_DEVICE" ? "Modo simulação" : "ESP32"}
      </p>
      {device.ultimaComunicacao && (
        <p className="mt-2 text-xs text-gray-400">
          Última comunicação: {new Date(device.ultimaComunicacao).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}
