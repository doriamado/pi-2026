import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DashboardSummary } from "../types";
import MetricCard from "../components/MetricCard";

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardSummary>("/dashboard"),
    refetchInterval: 10_000, // polling ate WebSocket existir
  });

  if (isLoading) return <p className="text-gray-500">Carregando painel...</p>;
  if (isError) return <p className="text-red-500">Não foi possível carregar o painel.</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Visão geral</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Dispositivos ativos" value={data?.dispositivosAtivos ?? 0} />
        <MetricCard label="Sensores online" value={data?.sensoresOnline ?? 0} />
        <MetricCard label="Irrigações em andamento" value={data?.irrigacoesEmAndamento ?? 0} />
        <MetricCard label="Alertas abertos" value={data?.alertasAbertos ?? 0} />
      </div>
    </div>
  );
}
