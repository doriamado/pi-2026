import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Device } from "../types";
import DeviceCard from "../components/DeviceCard";

export default function Devices() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
    refetchInterval: 10_000,
  });

  if (isLoading) return <p className="text-gray-500">Carregando dispositivos...</p>;
  if (isError) return <p className="text-red-500">Não foi possível carregar os dispositivos.</p>;
  if (!data?.length) return <p className="text-gray-500">Nenhum dispositivo cadastrado ainda.</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Dispositivos</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((device) => (
          <DeviceCard key={device.id} device={device} />
        ))}
      </div>
    </div>
  );
}
