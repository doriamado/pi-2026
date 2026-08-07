# Plataforma IoT — Irrigação Inteligente

Estrutura inicial da aplicação fullstack, conforme as especificações de
backend, frontend e banco de dados.

**Decisão de escopo (v1): não há autenticação.** Não existe módulo `auth`,
tela de login, nem controle de sessão. O `User` existe apenas como dono de
dispositivos.

## Estrutura

```
irrigacao-iot-platform/
├── backend/            Java 21 + Spring Boot (arquitetura em camadas)
│   └── src/main/java/com/eldorado/irrigacao/
│       ├── users/ devices/ sensors/ actuators/
│       ├── readings/ automation/ alerts/ irrigation/ events/
│       ├── gateway/     abstração DeviceGateway (fonte MOCK ou REAL)
│       ├── mock/        Mock Gateway (obrigatório, simula sensores)
│       └── dashboard/   resumo agregado para a tela inicial
├── frontend/           React + TypeScript + Vite + Tailwind
│   └── src/
│       ├── pages/       Dashboard, Devices, Sensors, Automation, History, Alerts, Settings
│       ├── components/  Navbar, Sidebar, MetricCard, DeviceCard, SensorCard, ChartCard, AlertCard
│       └── lib/api.ts   único ponto de comunicação com o backend
├── database/
│   └── schema.sql       tabelas, relações e índices
├── docker-compose.yml   sobe Postgres + backend
└── backend/Dockerfile
```

## Arquitetura do backend

```
Controller → Application Service → Domain → Repository → Database
```

Cada módulo (`devices`, `sensors`, `automation`, ...) é autocontido, com
suas próprias camadas `domain/`, `repository/`, `application/`, `api/`.
Nenhuma regra de negócio vive nos controllers.

### Device Gateway

`gateway.DeviceGateway` é a única abstração que a aplicação conhece para
entrada/saída de dados de dispositivos. Hoje só existe a implementação
`MockGatewayService` (`gateway/GatewaySource.MOCK`). Quando o hardware real
entrar (ESP32 via HTTP, depois MQTT/LoRa), basta criar uma nova
implementação de `DeviceGateway` — nenhum outro módulo muda.

### Mock Gateway

Componente obrigatório (`mock/MockGatewayService`), roda em ciclo agendado
(`@Scheduled`) e:
- gera leituras para sensores virtuais registrados;
- reduz a umidade do solo gradualmente;
- aumenta a temperatura com pequena oscilação;
- esvazia o reservatório aos poucos;
- simula perda de conexão (chance por ciclo).

Os dados são gravados nas mesmas tabelas dos dados reais, diferenciados
apenas pelo campo `origem` (`MOCK`/`REAL`) — por isso o resto da plataforma
não precisa de nenhuma adaptação para funcionar em modo simulação.

### Motor de automação

`automation.AutomationEngineService` roda em ciclo agendado, avalia todas
as `AutomationRule` ativas contra a leitura mais recente de umidade e de
reservatório, e aciona `IrrigationService.iniciar(...)` quando a condição é
satisfeita — reaproveitando o mesmo fluxo do `POST /irrigation/start`
manual. Trocar esse motor por um baseado em IA no futuro não deve exigir
mudança na API pública.

## Como rodar (desenvolvimento)

```bash
# banco + backend
docker compose up -d postgres
cd backend && ./mvnw spring-boot:run

# frontend
cd frontend && npm install && npm run dev
```

O frontend espera o backend em `http://localhost:8080` (configurável via
`VITE_API_URL`). CORS já liberado para `http://localhost:5173`.

## Pendências conhecidas (fora do escopo desta estruturação inicial)

- Testes unitários/integração/API (spec exige, ainda não implementados).
- WebSocket para tempo real (hoje o frontend faz polling).
- Endpoints de `PATCH /users/{id}` e demais ainda usam `Map<String,String>`
  como corpo simplificado — trocar por DTOs de validação (`jakarta.validation`)
  antes de produção.
- shadcn/ui não instalado (dependências base do Tailwind estão prontas para receber).
