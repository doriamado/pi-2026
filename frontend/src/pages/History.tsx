import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import ChartCard from "../components/ChartCard";

type Filtro = "hoje" | "semana" | "mes" | "personalizado";

interface ReadingPoint {
  timestamp: string;
  valor: number;
}

export default function History() {
  const [filtro, setFiltro] = useState<Filtro>("hoje");
  const [deviceId, setDeviceId] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["history", deviceId, filtro],
    queryFn: () => api.get<ReadingPoint[]>(`/readings/history?deviceId=${deviceId}&inicio=&fim=`),
    enabled: Boolean(deviceId),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Histórico</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          placeholder="ID do dispositivo"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />
        {(["hoje", "semana", "mes", "personalizado"] as Filtro[]).map((opcao) => (
          <button
            key={opcao}
            onClick={() => setFiltro(opcao)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              filtro === opcao ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
            }`}
          >
            {opcao}
          </button>
        ))}
      </div>

      {!deviceId && <p className="text-gray-500">Informe o ID de um dispositivo para ver o histórico.</p>}
      {isFetching && <p className="text-gray-500">Carregando...</p>}
      {data && <ChartCard title="Leituras ao longo do tempo" data={data} />}
    </div>
  );
}
