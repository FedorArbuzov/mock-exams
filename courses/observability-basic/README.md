# Observability — Basic

Базовый уровень: **зачем observability**, **модель Prometheus**, **PromQL**, **Grafana**, **scrape и exporters**, **алертинг**, **золотые сигналы RED/USE**, **введение в логи**, **сравнение с CloudWatch/Datadog**.

**Предварительно:** базовый Linux и Docker ([`linux-basic`](../linux-basic/README.md) или [`linux-intermediate`](../linux-intermediate/README.md) — достаточно `docker compose`, `curl` и браузера).

**Локально:** [`deploy/observability`](../../deploy/observability/README.md) — `docker compose up -d --build`, с хоста:

| Сервис | URL |
|--------|-----|
| Prometheus | [http://localhost:9090](http://localhost:9090) |
| Grafana | [http://localhost:3000](http://localhost:3000) — `admin` / `admin` |
| demo-app | [http://localhost:8000](http://localhost:8000) — `/metrics` |
| Alertmanager | [http://localhost:9093](http://localhost:9093) |

Трафик для лаб: `bash scripts/traffic.sh` в `deploy/observability`.

**Дальше:** [`observability-intermediate`](../observability-intermediate/README.md) (Loki, Promtail), [`observability-advanced`](../observability-advanced/README.md) (OTel, SLO). В Kubernetes — кратко [`kuber-advanced/14`](../kuber-advanced/14-observability.md) (kube-prometheus-stack).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте введение и «типичные ошибки».
2. Откройте **лабу** (03-lab, 05-lab…) с поднятым стендом `docker compose up -d --build` в `deploy/observability`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если что-то не сходится — [`deploy/observability/README.md`](../../deploy/observability/README.md) (datasource, `up`, OOM).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **40–50 минут** на пару «теория + лаба»; [финальный проект](13-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Откуда | Адрес |
|--------|--------|
| Браузер (UI) | `localhost:9090`, `localhost:3000`, `localhost:8000` |
| Внутри Docker-сети | `prometheus:9090`, `demo-app:8000` |
| Метрики приложения | `GET http://localhost:8000/metrics` |

## Программа

### Основы (01–03)

1. [Зачем observability](01-why-observability.md)
2. [Модель Prometheus: метрики, labels, TSDB](02-prometheus-model.md)
3. [Лаба: PromQL на стенде](03-lab-promql.md)

### Визуализация (04–05)

4. [Grafana: datasource, панели, переменные](04-grafana.md) · 5. [Лаба: дашборд demo-app](05-lab-dashboard.md)

### Сбор метрик (06–07)

6. [Exporters и scrape: jobs, targets, `up`](06-exporters-scrape.md) · 7. [Лаба: targets и node-exporter](07-lab-targets.md)

### Алертинг (08–09)

8. [Алертинг: правила, Alertmanager, routing](08-alerting-basics.md) · 9. [Лаба: Alertmanager и firing](09-lab-alertmanager.md)

### Сигналы и контекст (10–12)

10. [Золотые сигналы: RED и USE](10-golden-signals.md)
11. [Логи: зачем и связка с метриками](11-logs-preview.md)
12. [Prometheus/Grafana vs CloudWatch vs Datadog](12-vs-cloudwatch-datadog.md)

### Финал (13)

13. [Финальный проект](13-final-project.md)

## Что должно получиться

- Объясняете **три столпа** observability и роль **метрик** в инциденте.
- Пишете базовый **PromQL**: `rate`, `histogram_quantile`, фильтры по labels.
- Строите **дашборд** в Grafana с панелями RPS и latency.
- Читаете **Status → Targets**, диагностируете **`up==0`**.
- Настраиваете **alert rule**, видите алерт в **Prometheus** и **Alertmanager**.
- Формулируете **RED** для HTTP-сервиса и **USE** для узла.
- Понимаете, когда уходить в **Loki** (intermediate) или **kube-prometheus** (k8s).

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/promql-queries.txt`](examples/promql-queries.txt) | готовые запросы для лаб 03 и финала |
| [`examples/alert-rule.yml`](examples/alert-rule.yml) | образец правила для лаб 09 и проекта |
