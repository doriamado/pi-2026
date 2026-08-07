-- ============================================================
-- Plataforma IoT de Irrigacao Inteligente - Schema PostgreSQL
-- ============================================================
-- Sem tabelas de autenticacao/sessao na v1 (decisao de produto).

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------
-- Dados cadastrais (baixo volume)
-- ---------------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(30) NOT NULL,        -- ESP32 | MOCK_DEVICE
    status VARCHAR(20) NOT NULL DEFAULT 'DESCONHECIDO',
    origem VARCHAR(10) NOT NULL,      -- MOCK | REAL
    firmware_version VARCHAR(30),
    ultima_comunicacao TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sensors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(30) NOT NULL,        -- UMIDADE_SOLO | TEMPERATURA | NIVEL_RESERVATORIO
    online BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE actuators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    nome VARCHAR(150) NOT NULL,
    tipo VARCHAR(30) NOT NULL,        -- BOMBA_AGUA | VALVULA
    ligado BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    sensor_umidade_id UUID NOT NULL REFERENCES sensors(id),
    sensor_reservatorio_id UUID NOT NULL REFERENCES sensors(id),
    atuador_id UUID NOT NULL REFERENCES actuators(id),
    limiar_umidade_minimo NUMERIC(5,2) NOT NULL,
    limiar_reservatorio_minimo NUMERIC(5,2) NOT NULL,
    duracao_segundos INTEGER NOT NULL,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------
-- Dados historicos / telemetria (alto volume, somente insercao)
-- ---------------------------------------------------

CREATE TABLE readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_id UUID NOT NULL REFERENCES sensors(id),
    device_id UUID NOT NULL REFERENCES devices(id),
    valor NUMERIC(10,2) NOT NULL,
    unidade VARCHAR(10) NOT NULL,
    origem VARCHAR(10) NOT NULL,      -- MOCK | REAL
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    tipo VARCHAR(30) NOT NULL,
    descricao TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    origem VARCHAR(50) NOT NULL,
    mensagem TEXT NOT NULL,
    severidade VARCHAR(10) NOT NULL,  -- BAIXA | MEDIA | ALTA | CRITICA
    status VARCHAR(10) NOT NULL DEFAULT 'ABERTO',
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE irrigation_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID NOT NULL REFERENCES devices(id),
    atuador_id UUID NOT NULL REFERENCES actuators(id),
    automation_rule_id UUID REFERENCES automation_rules(id),
    status VARCHAR(20) NOT NULL DEFAULT 'EM_ANDAMENTO',
    start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    end_time TIMESTAMPTZ
);

-- ---------------------------------------------------
-- Indices para consultas por intervalo de datas e dispositivo
-- ---------------------------------------------------

CREATE INDEX idx_readings_device_timestamp ON readings(device_id, "timestamp");
CREATE INDEX idx_readings_sensor_timestamp ON readings(sensor_id, "timestamp");
CREATE INDEX idx_events_device_timestamp ON events(device_id, "timestamp");
CREATE INDEX idx_alerts_status_severidade ON alerts(status, severidade);
CREATE INDEX idx_irrigation_sessions_device_start ON irrigation_sessions(device_id, start_time);
