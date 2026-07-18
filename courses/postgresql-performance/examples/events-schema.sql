-- Схема для лаб performance (уроки 02, 08, 12)
CREATE SCHEMA IF NOT EXISTS perf;

DROP TABLE IF EXISTS perf.events CASCADE;
CREATE TABLE perf.events (
  id          bigserial PRIMARY KEY,
  device_id   int NOT NULL,
  event_type  text NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ~500k строк для лаб (выполнить в psql или через generate_series)
INSERT INTO perf.events (device_id, event_type, payload, created_at)
SELECT
  (random() * 1000)::int,
  (ARRAY['click','view','error'])[1 + (random() * 2)::int],
  jsonb_build_object('v', random()),
  now() - (random() * interval '90 days')
FROM generate_series(1, 500000);

ANALYZE perf.events;
