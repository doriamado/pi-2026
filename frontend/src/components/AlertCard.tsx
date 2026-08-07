import type { AlertItem } from "../types";

const severidadeColor: Record<AlertItem["severidade"], string> = {
  BAIXA: "bg-blue-100 text-blue-700",
  MEDIA: "bg-yellow-100 text-yellow-700",
  ALTA: "bg-orange-100 text-orange-700",
  CRITICA: "bg-red-100 text-red-700",
};

export default function AlertCard({ alert }: { alert: AlertItem }) {
  return (
    <div className="flex items-start justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <span className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${severidadeColor[alert.severidade]}`}>
          {alert.severidade}
        </span>
        <p className="text-sm text-gray-900">{alert.mensagem}</p>
        <p className="mt-1 text-xs text-gray-400">
          {alert.origem} · {new Date(alert.timestamp).toLocaleString("pt-BR")}
        </p>
      </div>
      <span className={`text-xs font-medium ${alert.status === "ABERTO" ? "text-red-600" : "text-emerald-600"}`}>
        {alert.status}
      </span>
    </div>
  );
}
