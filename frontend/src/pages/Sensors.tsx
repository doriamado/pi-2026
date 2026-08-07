import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Sensor } from "../types";
import SensorCard from "../components/SensorCard";

export default function Sensors() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["sensors"],
    queryFn: () => api.get<Sensor[]>("/sensors"),
    refetchInterval: 10_000,
  });

  if (isLoading) return <p className="text-gray-500">Carregando sensores...</p>;
  if (isError) return <p className="text-red-500">Não foi possível carregar os sensores.</p>;
  if (!data?.length) return <p className="text-gray-500">Nenhum sensor cadastrado ainda.</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Sensores</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((sensor) => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>
    </div>
  );
}
