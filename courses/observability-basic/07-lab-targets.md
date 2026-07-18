# 07. Лаба: targets, node-exporter и диагностика `up`

## Цель лабы

Разобрать **Status → Targets**, сравнить метрики **demo-app**, **node-exporter**, **cAdvisor**; симулировать **`up==0`** и восстановить target.

## Предварительно

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh
```

См. [`deploy/observability/README.md`](../../deploy/observability/README.md).

---

## Задание 1. Обзор targets

**Зачем:** карта сбора метрик.

1. [http://localhost:9090/targets](http://localhost:9090/targets)
2. Запишите jobs: `prometheus`, `demo-app`, `node-exporter`, `cadvisor`.
3. Для каждого: **Last scrape**, **State**, **Labels** (`job`, `instance`).

**Что увидите:** все **UP**, интервал ~15s.

---

## Задание 2. Сырой `/metrics` demo-app

```bash
curl -s http://localhost:8000/metrics | grep -E "^demo_http|^# TYPE demo"
```

**Что увидите:** TYPE counter/gauge/histogram и labels `method`, `path`, `status`.

В Prometheus Graph:

```promql
count({__name__=~"demo_http.*"})
```

(оценка числа series — порядок десятков, не тысяч).

---

## Задание 3. node-exporter

```promql
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
```

**Что увидите:** доля свободной RAM 0–1.

```promql
rate(node_disk_read_bytes_total[5m])
```

Опционально — сопоставьте с загрузкой хоста.

---

## Задание 4. cAdvisor UI

Откройте [http://localhost:8082](http://localhost:8082) — контейнеры compose.

В PromQL:

```promql
sum by (name) (rate(container_cpu_usage_seconds_total{name=~".*demo.*"}[5m]))
```

**Что увидите:** CPU usage контейнера demo-app (имя может отличаться — подберите regex по label `name` из **Table**).

---

## Задание 5. Симуляция `up==0`

**Зачем:** отработать runbook.

```bash
docker compose stop demo-app
```

Подождите 30–60 с. В **Targets** `demo-app` → **DOWN**. Запрос:

```promql
up{job="demo-app"}
```

**Что увидите:** `0` или отсутствие series.

Восстановление:

```bash
docker compose start demo-app
```

Через 1–2 scrape цикла — снова **UP**.

---

## Задание 6. Scrape duration

```promql
scrape_duration_seconds{job="demo-app"}
```

**Что увидите:** доли секунды. Сравните с `job="cadvisor"` (часто тяжелее).

---

## Критерии успеха

- [ ] Перечислены все jobs стенда и их targets
- [ ] `/metrics` demo-app просмотрен вручную
- [ ] Запрос по `node_memory_*` выполнен
- [ ] После `stop demo-app` — `up==0`, после `start` — восстановление
- [ ] Понятна разница app metrics vs node vs container

## Что унести в работу

- Первый шаг при «нет метрик» — **Targets**, не Grafana
- Остановка контейнера = учебный аналог падения pod

Следующий урок: [08. Алертинг](08-alerting-basics.md).
