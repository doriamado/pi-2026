import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AlertItem } from "../types";
import AlertCard from "../components/AlertCard";

export default function Alerts() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => api.get<AlertItem[]>("/alerts"),
    refetchInterval: 10_000,
  });

  if (isLoading) return <p className="text-gray-500">Carregando alertas...</p>;
  if (isError) return <p className="text-red-500">Não foi possível carregar os alertas.</p>;
  if (!data?.length) return <p className="text-gray-500">Nenhum alerta no momento. 🌱</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Alertas</h1>
      <div className="space-y-3">
        {data.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
