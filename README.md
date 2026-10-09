# Plataforma Verda — Irrigação IoT

## Como rodar

### 1) Banco de Dados

```bash
docker compose up -d irrigacao-postgres


### 2) Backend

```bash
cd backend
./mvnw spring-boot:run   # ou: mvn spring-boot:run, se tiver o Maven instalado
```

A API sobe em `http://localhost:8080`. O schema (`schema.sql`) roda
automaticamente na inicialização, e na primeira vez que o banco estiver
vazio a aplicação semeia 4 dispositivos de demonstração com uma semana de
histórico — os mesmos 4 que já estavam fixos no seu front-end original
(Horta Norte, Estufa de tomates, Pomar Sul, Jardim da sede).

Por padrão um **simulador** roda a cada 1 minuto e gera novas leituras
plausíveis para esses dispositivos (menos "Jardim da sede", que fica
offline de propósito, como no protótipo original). Isso é só para a
demonstração ficar viva sem precisar de um Arduino real conectado.
Quando for ligar dispositivos de verdade, desligue o simulador:

```yaml
# application.yml ou variável de ambiente
irrigacao:
  simulador:
    ativo: false   # ou SIMULADOR_ATIVO=false
```

Funcionamento do firmware do Arduino (requisição a cada leitura):

```
POST http://<host>:8080/api/ingest/{deviceId}/readings
Content-Type: application/json

{ "moisture": 62.5, "temperature": 24.1, "water": 78.0 }
```

### 3) Frontend

```bash
cd frontend
pnpm install
cp .env.example .env   # ajuste VITE_API_URL se o backend não estiver em localhost:8080
pnpm dev
```

### 4) Tudo junto via Docker

```bash
docker compose up --build
```

## Principais endpoints

| Rota | Descrição |
|---|---|
| `GET /api/dashboard` | Métricas da visão geral, gráfico de umidade das últimas 24h, alertas recentes, lista de dispositivos |
| `GET /api/devices` | Lista de dispositivos (para a tela "Meus dispositivos") |
| `GET /api/devices/{id}?days=1\|7` | Detalhe de um dispositivo + histórico |
| `POST /api/devices` | Cadastra um dispositivo (`name`, `type`, `id`, `location`) |
| `PATCH /api/devices/{id}/settings` | Salva limites de umidade/duração/automação |
| `POST /api/devices/{id}/irrigation/start` \| `.../stop` | Controle manual da irrigação |
| `GET /api/alerts?onlyUnread=` | Lista de alertas + resumo (não lidos, alta prioridade, etc.) |
| `POST /api/alerts/read-all` \| `POST /api/alerts/{id}/read` | Marcar alertas como lidos |
| `GET /api/settings` \| `PUT /api/settings` | Perfil, notificações e preferências |
| `POST /api/ingest/{deviceId}/readings` | Endpoint de ingestão para o Arduino |

Todos os dados sensíveis a limite (offline, água baixa, umidade baixa) são
configuráveis em `application.yml`, seção `irrigacao.limites`.

## Observações

- Não há autenticação/login, exatamente como no protótipo original (v1).
- O status "online/offline/alerta" de cada dispositivo é **calculado** a
  cada requisição a partir da última leitura recebida — não é um campo que
  possa ficar dessincronizado.
- CORS já vem liberado para `localhost:5173`, `localhost:8443` (servidor de
  dev do Figma Make) e `localhost:3000`; ajuste `CORS_ORIGENS` se precisar
  de outra origem.
