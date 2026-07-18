# 02. Лаба: Jaeger и OTLP на стенде

## Цель

Поднять overlay **OTel + Jaeger**, отправить trace через **OTLP HTTP**, увидеть spans в UI **16686**, подключить scrape метрик collector в Prometheus.

## Предварительно

- Docker, **4+ ГБ RAM**.
- Базовый стек из [`deploy/observability`](../../deploy/observability/README.md).
- Прочитаны [01-otel-traces](01-otel-traces.md).

---

## Задание 1. Поднять стек с traces

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d --build
docker compose ps
```

| Сервис | URL |
|--------|-----|
| Jaeger UI | http://localhost:16686 |
| OTLP HTTP (collector) | http://localhost:4318 |
| Grafana | http://localhost:3000 (`admin` / `admin`) |

Smoke:

```bash
bash scripts/smoke.sh
bash scripts/traffic.sh
```

---

## Задание 2. Отправить trace вручную (OTLP HTTP)

Скопируйте payload из [`examples/otel-span.json`](examples/otel-span.json) или используйте его как есть:

```bash
curl -sS -X POST "http://localhost:4318/v1/traces" \
  -H "Content-Type: application/json" \
  --data-binary @../../courses/observability-advanced/examples/otel-span.json
```

**Что увидите в Jaeger:**

1. Service: `demo-app`
2. Operation: `GET /health`
3. Child span: `redis.GET session:abc`

**Если пусто:** проверьте `docker compose logs otel-collector`, что receiver `otlp` слушает `4318`.

---

## Задание 3. Prometheus scrape OTel metrics

Collector экспортирует Prometheus metrics на `:8889`. Добавьте job (лабораторно — merge `prometheus-otel.yml`):

Фрагмент из [`deploy/observability/config/prometheus-otel.yml`](../../deploy/observability/config/prometheus-otel.yml):

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8889"]
```

Перезапустите Prometheus или смонтируйте merged config (см. README стенда). В Prometheus → **Targets** → `otel-collector` = **UP**.

Запрос для проверки:

```promql
up{job="otel-collector"}
```

---

## Задание 4. Tabletop: propagation

Нарисуйте на бумаге 3 сервиса: `api` → `worker` → `redis`. Ответьте письменно:

1. Где создаётся **root span**?
2. Какой заголовок передаёт `api` в `worker`?
3. Что сломается, если `worker` публикует в SQS без trace context?

**Критерий:** один непрерывный `trace_id` на диаграмме.

---

## Задание 5. (Опционально) Связь с Redis labs

Представьте, что child span `redis.GET` — 800 ms. Какие **две** команды Redis вы выполните первыми? (Подсказка: [redis-intermediate/15-monitoring](../redis-intermediate/15-monitoring.md).)

<details>
<summary>Ответ</summary>

`redis-cli SLOWLOG GET 10` и `redis-cli INFO commandstats` (или `LATENCY DOCTOR`).
</details>

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| Jaeger пустой | `curl` на `4318`; логи `otel-collector` |
| `connection refused` 4318 | `docker compose ps` — контейнер `mock-otel-collector` |
| Prometheus `up=0` | target `otel-collector:8889` только из сети compose |
| OOM | `docker compose down -v`, поднимите без cAdvisor |

---

## Критерии успеха

- [ ] Jaeger показывает trace с parent + child span
- [ ] `up{job="otel-collector"} == 1`
- [ ] Tabletop с `traceparent` заполнен
- [ ] (Опционально) Связали trace с Redis SLOWLOG

## Уборка

```bash
docker compose -f docker-compose.yml -f docker-compose.otel.yml down -v
```

Следующий урок: [03-kube-prometheus.md](03-kube-prometheus.md).
