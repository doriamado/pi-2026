import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { Device } from "../types";
import DeviceCard from "../components/DeviceCard";

type User = {
  id: string;
  nome: string;
  email: string;
};

type DeviceForm = {
  nome: string;
  tipo: Device["tipo"];
  origem: Device["origem"];
};

const initialForm: DeviceForm = {
  nome: "",
  tipo: "MOCK_DEVICE",
  origem: "MOCK",
};

export default function Devices() {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<DeviceForm>(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [feedback, setFeedback] = useState("");

  const devices = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.get<Device[]>("/devices"),
    refetchInterval: 10_000,
  });

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  const createDevice = useMutation({
    mutationFn: async (payload: DeviceForm) => {
      let user = users.data?.[0];

      if (!user) {
        user = await api.post<User>("/users", {
          nome: "Administrador",
          email: `admin-${Date.now()}@local.dev`,
        });
      }

      return api.post<Device>("/devices", {
        ...payload,
        userId: user.id,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["devices"],
      });

      setForm(initialForm);
      setShowForm(false);
      setFeedback("Dispositivo cadastrado com sucesso.");
    },

    onError: () => {
      setFeedback(
        "Não foi possível cadastrar o dispositivo. Verifique se o backend está ligado."
      );
    },
  });

  const removeDevice = useMutation({
    mutationFn: (id: string) => api.delete(`/devices/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["devices"],
      });

      setFeedback("Dispositivo removido.");
    },

    onError: () => {
      setFeedback("Não foi possível remover o dispositivo.");
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.nome.trim()) {
      setFeedback("Informe um nome para o dispositivo.");
      return;
    }

    setFeedback("");
    createDevice.mutate(form);
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Dispositivos
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Cadastre, acompanhe e remova dispositivos da plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((current) => !current);
            setFeedback("");
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "+ Novo dispositivo"}
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {feedback}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <form
          onSubmit={submit}
          className="grid gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:grid-cols-2"
        >
          <label className="text-sm font-medium text-gray-700">
            Nome

            <input
              type="text"
              value={form.nome}
              onChange={(event) =>
                setForm({
                  ...form,
                  nome: event.target.value,
                })
              }
              placeholder="Ex.: Jardim frontal"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            Tipo

            <select
              value={form.tipo}
              onChange={(event) =>
                setForm({
                  ...form,
                  tipo: event.target.value as Device["tipo"],
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
            >
              <option value="MOCK_DEVICE">
                Dispositivo simulado
              </option>

              <option value="ESP32">
                ESP32
              </option>
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700">
            Origem

            <select
              value={form.origem}
              onChange={(event) =>
                setForm({
                  ...form,
                  origem: event.target.value as Device["origem"],
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal outline-none focus:border-blue-500"
            >
              <option value="MOCK">
                Simulação
              </option>

              <option value="REAL">
                Real
              </option>
            </select>
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={createDevice.isPending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createDevice.isPending
                ? "Cadastrando..."
                : "Cadastrar dispositivo"}
            </button>
          </div>
        </form>
      )}

      {/* Conteúdo */}
      {devices.isLoading ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-500">
          Carregando dispositivos...
        </div>
      ) : devices.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-10 text-center text-red-600">
          Não foi possível carregar os dispositivos.
        </div>
      ) : !devices.data?.length ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-medium text-gray-800">
            Nenhum dispositivo cadastrado
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Clique em <strong>+ Novo dispositivo</strong> para cadastrar o
            primeiro dispositivo.
          </p>

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Cadastrar primeiro dispositivo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.data.map((device) => (
            <div key={device.id} className="space-y-2">
              <DeviceCard device={device} />

              <button
                type="button"
                onClick={() => removeDevice.mutate(device.id)}
                disabled={removeDevice.isPending}
                className="text-sm text-red-600 hover:underline disabled:opacity-50"
              >
                Remover dispositivo
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}