# 03. Лаба: PromQL — rate, ошибки, p95

## Цель лабы

Поднять стенд observability, сгенерировать трафик и выполнить **базовые запросы PromQL** в UI Prometheus: `up`, `rate`, доля 404, **p95 latency** из histogram.

## Предварительно

- Docker, **4+ ГБ RAM** рекомендуется.
- Из корня репозитория:

```bash
cd deploy/observability
docker compose up -d --build
docker compose ps
bash scripts/smoke.sh
bash scripts/traffic.sh
```

Подробности: [`deploy/observability/README.md`](../../deploy/observability/README.md).  
Шпаргалка запросов: [`examples/promql-queries.txt`](examples/promql-queries.txt).

---

## Задание 1. Targets и `up`

**Зачем:** без живого scrape PromQL бессмысленен.

1. Откройте [http://localhost:9090/targets](http://localhost:9090/targets).
2. Убедитесь: **demo-app**, **node-exporter**, **prometheus** — State **UP**.

В **Graph** выполните:

```promql
up
up{job="demo-app"}
```

**Что увидите:** значения `1` для живых targets; при остановке demo-app — `0`.

---

## Задание 2. RPS по статусам

**Зачем:** RED — Rate; counter требует `rate`.

```promql
sum(rate(demo_http_requests_total[5m]))
```

По статусам:

```promql
sum by (status) (rate(demo_http_requests_total[5m]))
```

Переключите **Graph** → Table, отсортируйте по Value.

**Что увидите:** ненулевой RPS после `traffic.sh`; отдельная series для `200` и `404`.

---

## Задание 3. Доля 404

**Зачем:** Errors в RED — не только 5xx.

```promql
sum(rate(demo_http_requests_total{status="404"}[5m]))
/
sum(rate(demo_http_requests_total[5m]))
```

**Что увидите:** доля около **0.05–0.15** (скрипт каждый 10-й запрос бьёт `/missing`). Без трафика — `NaN`.

Повторите `bash scripts/traffic.sh` и нажмите **Execute** снова.

---

## Задание 4. p95 latency

**Зачем:** Duration — histogram + `histogram_quantile`.

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(demo_http_request_duration_seconds_bucket[5m]))
)
```

**Что увидите:** значение в **секундах** (например 0.1–0.25). Сравните с p99 (`0.99` вместо `0.95`).

---

## Задание 5. Gauge in-flight

**Зачем:** отличие Gauge от Counter.

```promql
demo_http_in_progress
```

Во время длинного запроса значение может быть > 0; в покое — 0.

---

## Задание 6. node-exporter (опционально)

```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Что увидите:** приблизительная загрузка CPU хоста (%).

---

## Задание 7. Экспорт запроса

Скопируйте три рабочих запроса (RPS, 404 share, p95) в свой файл или в комментарий к отчёту. Сверьте с [`examples/promql-queries.txt`](examples/promql-queries.txt).

---

## Критерии успеха

- [ ] Все ключевые targets **UP**
- [ ] `rate(demo_http_requests_total[5m])` даёт RPS > 0 после трафика
- [ ] Доля 404 вычисляется без ошибки парсинга
- [ ] p95 из histogram возвращает число < 1s на стенде
- [ ] Понятно, почему без `[5m]` `rate` не работает

## Что унести в работу

- PromQL в Prometheus UI → те же запросы в Grafana Explore
- Перед инцидентом проверяйте **`up`** и наличие **недавних сэмплов**
- Counters — только через **`rate` / `increase`**

Следующий урок: [04. Grafana](04-grafana.md).
