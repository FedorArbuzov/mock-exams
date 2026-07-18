# 05. Лаба: дашборд Grafana для demo-app

## Цель лабы

Создать **dashboard** с панелями RED (RPS, error share, p95), переменной `job` и порогами. Проверить данные после `traffic.sh`.

## Предварительно

- Стенд запущен, smoke OK:

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/traffic.sh
```

- Grafana: [http://localhost:3000](http://localhost:3000) — `admin` / `admin`
- Теория: [04. Grafana](04-grafana.md)

---

## Задание 1. Проверка datasource

**Зачем:** «No data» чаще всего — сломан datasource.

1. **Connections → Data sources → Prometheus → Save & test**.
2. **Explore** → запрос `up{job="demo-app"}` → Run.

**Что увидите:** линия или точка со значением `1`.

---

## Задание 2. Новый dashboard

**Зачем:** закрепить структуру RED.

1. **Dashboards → New → New dashboard**.
2. Title: `Demo App — Basic`.
3. **Settings** (шестерёнка): Tags `lab`, `observability-basic`.

---

## Задание 3. Панель RPS

**Зачем:** Rate.

- **Add visualization** → Prometheus.
- Query A:

```promql
sum(rate(demo_http_requests_total{job="demo-app"}[5m]))
```

- Panel title: `RPS`
- Unit: **requests/sec**

**Что увидите:** стабильный RPS > 0 после трафика.

---

## Задание 4. Панель Error rate (404+5xx)

```promql
sum(rate(demo_http_requests_total{job="demo-app",status!~"2.."}[5m]))
/
sum(rate(demo_http_requests_total{job="demo-app"}[5m]))
```

- Visualization: **Time series** или **Stat**
- Unit: **Percent (0.0–1.0)**
- Thresholds: green < 0.05, yellow < 0.15, red выше

**Что увидите:** ненулевая доля из-за 404 от `traffic.sh`.

---

## Задание 5. Панель p95 latency

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(demo_http_request_duration_seconds_bucket{job="demo-app"}[5m]))
)
```

- Unit: **seconds (s)**
- Title: `p95 latency`

---

## Задание 6. Переменная job

**Зачем:** один дашборд — несколько jobs.

1. **Dashboard settings → Variables → Add variable**
2. Type: Query, Data source: Prometheus
3. Query: `label_values(up, job)`
4. Name: `job`, Multi-value + Include All

Обновите запросы: `{job=~"$job"}` вместо жёсткого `demo-app`.

**Что увидите:** переключение между `demo-app` и `node-exporter` меняет RPS (у node другие метрики — ожидайте empty или другие series).

---

## Задание 7. Сохранение и JSON (опционально)

**Save dashboard**. **Share → Export** — посмотрите JSON (не коммитьте секреты).

---

## Критерии успеха

- [ ] Datasource test успешен
- [ ] Три панели RED отображают данные после `traffic.sh`
- [ ] Error panel показывает долю > 0
- [ ] Переменная `job` переключает targets
- [ ] Dashboard сохранён с понятным title и tags

## Что унести в работу

- Один сервис — один dashboard + стандартный row RED
- Пороги на панелях согласуйте с **alert rules**, не дублируйте разные числа без причины

Следующий урок: [06. Exporters и scrape](06-exporters-scrape.md).
