# 08. Лаба: on-call drill на стенде

## Цель

Пройти **симулированный инцидент** 45–60 мин: alert → RED → logs (если есть overlay) → trace → runbook → postmortem notes.

## Предварительно

- [07-troubleshooting-runbooks](07-troubleshooting-runbooks.md)
- Стек: `docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d`
- [`examples/runbook-template.md`](examples/runbook-template.md)

Таймер и «incident channel» (чат с собой или партнёр).

---

## Сценарий A: latency (30 мин)

**Симптом (от «менеджера»):** «API медленный, ошибок мало».

### Шаг 1 — Metrics (10 мин)

```bash
bash scripts/traffic.sh
```

PromQL:

```promql
histogram_quantile(0.99, sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le))
sum(rate(demo_http_requests_total[5m])) by (status)
```

Запишите p99 и error ratio.

### Шаг 2 — Trace (10 мин)

Отправьте trace из [02-lab-jaeger](02-lab-jaeger.md). В Jaeger найдите child span `redis.GET` — **гипотеза:** Redis slow.

Ветка Redis (tabletop или реальный `deploy/redis`):

```bash
redis-cli SLOWLOG GET 5
redis-cli INFO commandstats
```

### Шаг 3 — Runbook (10 мин)

Скопируйте шаблон → `my-runbook-latency.md`. Заполните:

- Symptoms
- 3 PromQL из сценария
- Mitigation: «scale cache», «fix hot key»

---

## Сценарий B: error spike (15 мин)

Сгенерируйте 404:

```bash
for i in $(seq 1 100); do curl -sf "http://localhost:8000/missing" >/dev/null 2>&1 || true; done
```

```promql
sum(rate(demo_http_requests_total{status="404"}[5m]))
/ sum(rate(demo_http_requests_total[5m]))
```

**Вопрос:** это SEV-1? Аргументируйте (зависит от SLO на 404 vs 5xx).

---

## Сценарий C: «No data» (10 мин)

Остановите demo-app:

```bash
docker compose stop demo-app
```

Через 2–3 scrape intervals:

```promql
up{job="demo-app"}
```

Какой alert сработает из [`demo-alerts.yml`](../../deploy/observability/config/rules/demo-alerts.yml)? Запишите имя и `for:`.

Восстановите:

```bash
docker compose start demo-app
```

---

## Post-incident (5 мин)

| Поле | Ваш ответ |
|------|-----------|
| Root cause (учебный) | |
| Time to detect | |
| Time to mitigate | |
| One action item | |

---

## Критерии успеха

- [ ] Runbook `my-runbook-latency.md` с PromQL и mitigation
- [ ] Jaeger trace связан с Redis-гипотезой
- [ ] Объяснён `up{job="demo-app"}==0`
- [ ] Post-incident table заполнена

Следующий урок: [09-interview-qa.md](09-interview-qa.md).
