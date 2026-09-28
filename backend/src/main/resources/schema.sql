CREATE SCHEMA IF NOT EXISTS verda;

CREATE TABLE IF NOT EXISTS device (
  id                   VARCHAR(40)  PRIMARY KEY,               -- código impresso no Arduino, ex.: ARD-IRR-0421
  name                 VARCHAR(120) NOT NULL,
  location             VARCHAR(160) NOT NULL DEFAULT '',
  type                 VARCHAR(60)  NOT NULL,
  moisture             DOUBLE PRECISION,                       -- última leitura (NULL até a primeira)
  temperature          DOUBLE PRECISION,
  water                DOUBLE PRECISION,
  last_seen_at         TIMESTAMPTZ,
  firmware             VARCHAR(30)  NOT NULL DEFAULT 'v2.4.1',
  connectivity         VARCHAR(60)  NOT NULL DEFAULT 'Wi-Fi',
  rssi                 INTEGER,
  installed_at         DATE         NOT NULL DEFAULT CURRENT_DATE,
  min_moisture         INTEGER      NOT NULL DEFAULT 40,
  default_duration_min INTEGER      NOT NULL DEFAULT 15,
  auto_irrigation      BOOLEAN      NOT NULL DEFAULT TRUE,
  disconnect_alerts    BOOLEAN      NOT NULL DEFAULT TRUE,
  schedule_time        TIME         DEFAULT '18:00',           -- rotina diária de irrigação
  irrigating_until     TIMESTAMPTZ,                            -- futuro => irrigando agora
  irrigation_mode      VARCHAR(10),                            -- manual | auto
  irrigation_minutes   INTEGER      NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reading (
  id          BIGSERIAL PRIMARY KEY,
  device_id   VARCHAR(40) NOT NULL REFERENCES device(id) ON DELETE CASCADE,
  moisture    DOUBLE PRECISION NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  water       DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reading_device_time ON reading (device_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_time ON reading (recorded_at DESC);

CREATE TABLE IF NOT EXISTS alert (
  id          BIGSERIAL PRIMARY KEY,
  device_id   VARCHAR(40) REFERENCES device(id) ON DELETE CASCADE,
  kind        VARCHAR(30)  NOT NULL,   -- LOW_MOISTURE | LOW_WATER | OFFLINE | IRRIGATION_DONE | FIRMWARE
  level       VARCHAR(10)  NOT NULL,   -- high | medium | low
  title       VARCHAR(160) NOT NULL,
  message     VARCHAR(400) NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  is_read     BOOLEAN      NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ               -- NULL => ainda ativo
);
CREATE INDEX IF NOT EXISTS idx_alert_created ON alert (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_device_kind ON alert (device_id, kind) WHERE resolved_at IS NULL;

-- Configurações da conta (a v1 não tem login: existe uma única linha)
CREATE TABLE IF NOT EXISTS app_settings (
  id                SMALLINT PRIMARY KEY CHECK (id = 1),
  full_name         VARCHAR(120) NOT NULL,
  email             VARCHAR(160) NOT NULL,
  phone             VARCHAR(40)  NOT NULL DEFAULT '',
  role              VARCHAR(40)  NOT NULL DEFAULT 'Administradora',
  property_name     VARCHAR(120) NOT NULL,
  property_location VARCHAR(160) NOT NULL DEFAULT '',
  notify_critical   BOOLEAN NOT NULL DEFAULT TRUE,
  notify_offline    BOOLEAN NOT NULL DEFAULT TRUE,
  notify_routines   BOOLEAN NOT NULL DEFAULT FALSE,
  notify_weekly     BOOLEAN NOT NULL DEFAULT TRUE,
  language          VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
  timezone          VARCHAR(60) NOT NULL DEFAULT 'America/Sao_Paulo',
  temperature_unit  VARCHAR(1)  NOT NULL DEFAULT 'C',
  date_format       VARCHAR(20) NOT NULL DEFAULT 'DD/MM/AAAA'
);

INSERT INTO app_settings (id, full_name, email, phone, role, property_name, property_location)
VALUES (1, 'Marina Costa', 'marina@fazenda.com', '(16) 99982-4401', 'Administradora', 'Fazenda Santa Luzia', 'Ribeirão Preto, São Paulo')
ON CONFLICT (id) DO NOTHING;
