import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AutomationRule } from "../types";

export default function Automation() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["automation-rules"],
    queryFn: () => api.get<AutomationRule[]>("/automation"),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) =>
      api.patch(`/automation/${id}`, { ativa }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automation-rules"] }),
  });

  if (isLoading) return <p className="text-gray-500">Carregando regras...</p>;
  if (isError) return <p className="text-red-500">Não foi possível carregar as regras.</p>;

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Automação</h1>
      <div className="space-y-3">
        {data?.map((rule) => (
          <div key={rule.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-gray-700">
              SE umidade &lt; {rule.limiarUmidadeMinimo}% E reservatório &gt; {rule.limiarReservatorioMinimo}%
              {" "}→ ligar bomba por {rule.duracaoSegundos}s
            </div>
            <button
              onClick={() => toggleMutation.mutate({ id: rule.id, ativa: !rule.ativa })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                rule.ativa ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
              }`}
            >
              {rule.ativa ? "Ativa" : "Desativada"}
            </button>
          </div>
        ))}
        {!data?.length && <p className="text-gray-500">Nenhuma regra cadastrada ainda.</p>}
      </div>
    </div>
  );
}
