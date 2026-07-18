# 03. Loki и LogQL

## Модель данных: не «логи как в Elasticsearch»

**Loki** хранит потоки логов, индексируя в первую очередь **labels** (как Prometheus — labels для метрик). Тело строки **не** индексируется полнотекстово по умолчанию: фильтрация по содержимому — **после** отбора потоков, сканированием chunk'ов.

Плюсы:

- Дешевле хранить большие объёмы.
- Естественная связка с Grafana и метриками (одни и те же labels: `cluster`, `namespace`, `pod`).

Минусы:

- «Найди любое слово по всему кластеру за месяц» без узкого selector — медленно; нужны осмысленные labels и pipeline в Promtail.

На стенде Loki слушает **3100** (`docker-compose.logs.yml`), datasource в Grafana: `http://loki:3100`.

## Поток (stream)

Набор label → value однозначно задаёт поток, например:

```text
{container="mock-demo-app", stream="stdout"}
```

В Explore Grafana выбираете label filters — это **log stream selector**.

## LogQL: два режима

### 1. Log queries (строки)

```logql
{container="mock-demo-app"} |= "error"
```

- `{...}` — selector по labels.
- `|=`, `!=`, `|~`, `!~` — line filters (регэксп для `|~`).

Цепочка фильтров:

```logql
{container="mock-demo-app"} |= "GET" != "/health"
```

### 2. Metric queries (агрегаты по логам)

Как PromQL, но источник — логи:

```logql
sum(rate({container="mock-demo-app"}[5m]))
```

Функции: `rate`, `count_over_time`, `bytes_over_time`, `sum`, `avg`, `topk`, …

Примеры — в [examples/logql-queries.txt](examples/logql-queries.txt).

## Labels на стенде

**Promtail** с `docker_sd_configs` читает Docker socket и навешивает labels из metadata контейнера (`config/promtail.yml`):

- `container` — имя контейнера (`mock-demo-app`, …)
- `stream` — `stdout` / `stderr`

Без overlay логов Grafana datasource Loki есть, но данных нет — нужен:

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

## Корреляция метрик и логов

Типичный сценарий расследования:

1. Алерт `DemoHighErrorRate` в Prometheus.
2. В Grafana: **Explore** → Prometheus, смотрим всплеск `demo:http_errors:rate5m`.
3. **Split** или новая вкладка → Loki:

   ```logql
   {container="mock-demo-app"} |~ "error|5[0-9]{2}"
   ```

4. Сужаем временное окно до минуты всплеска.

Если приложение пишет **структурированный JSON** с `trace_id`, pipeline в Promtail вытаскивает label — и можно перейти к трейсу (advanced / OTel).

## Retention и лимиты

`config/loki.yml`: filesystem storage, `retention_period: 168h` (7 дней). Для учебного стенда достаточно; в production — object storage (S3), compactor, лимиты ingestion.

## Loki vs ELK / OpenSearch

| | Loki | ELK |
|---|------|-----|
| Индекс | Labels | Полнотекст |
| Запрос | LogQL | DSL |
| Стоимость | Ниже при правильных labels | Выше при «всё в индекс» |
| Связка с Prometheus | Нативная | Через интеграции |

Полнотекстовый поиск и ISM для «тяжёлых» логов — отдельный курс [opensearch-basic](../opensearch-basic/README.md) → [intermediate](../opensearch-intermediate/README.md) ([`deploy/opensearch`](../../deploy/opensearch/README.md)).

## Связь с Kafka

Consumer lag вы смотрите в метриках ([kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md)); логи broker/connector полезны для **почему** отставание выросло — те же принципы selector'ов в Loki (`{container="kafka"}` после настройки Promtail).

## Чек-лист

- [ ] Понимаете разницу log query и metric query в LogQL.
- [ ] Знаете, какие labels даёт Promtail на Docker-стенде.
- [ ] Умеете сузить время и связать всплеск метрики с потоком логов.

**Дальше:** [04. Лаба: Loki](04-lab-loki.md).
