# 04. Лаба: Loki и LogQL в Grafana

## Цель

Поднять overlay **Loki + Promtail**, увидеть логи контейнеров в Grafana Explore, выполнить запросы из [examples/logql-queries.txt](examples/logql-queries.txt).

## Подготовка

Базовый стек уже запущен. Добавьте логи:

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
docker compose ps
```

| Сервис | Проверка |
|--------|----------|
| Loki | `curl -s http://localhost:3100/ready` → `ready` |
| Promtail | `docker compose logs promtail --tail 20` — без fatal error |

Сгенерируйте трафик и логи контейнеров:

```bash
bash scripts/traffic.sh
```

*Windows:* Promtail требует доступ к `docker.sock`; если логов нет — см. troubleshooting в [deploy/observability/README.md](../../deploy/observability/README.md).

## Задание 1. Label browser

1. Grafana → **Explore** → datasource **Loki**.
2. **Label browser** — найдите label `container`.
3. Выберите `mock-demo-app` (или актуальное имя из `docker compose ps`).

Запрос:

```logql
{container="mock-demo-app"}
```

Должны появиться строки (stdout контейнера; demo-app подавляет access-log в коде — будут в основном системные сообщения; для практики подойдут логи **prometheus**, **grafana**).

## Задание 2. Line filter

```logql
{container="mock-prometheus"} |= "level=error"
```

Или любой контейнер с достаточным объёмом логов:

```logql
{container=~"mock-.*"} != ""
```

Скопируйте ещё 3 запроса из `examples/logql-queries.txt` и зафиксируйте, что вернул каждый.

## Задание 3. Metric query по логам

```logql
sum by (container) (rate({job="docker"}[5m]))
```

Постройте **bar gauge** «топ контейнеров по объёму логов». Кто «шумит» больше всех?

## Задание 4. Корреляция с Prometheus

1. Explore → **Prometheus**: `sum(rate(demo_http_requests_total[5m]))`.
2. Зафиксируйте интервал всплеска RPS (после `traffic.sh`).
3. Explore → **Loki**, тот же интервал: логи `mock-demo-app` или соседних сервисов.

В заметках ответьте: **какие labels общие** между метрикой `demo_http_requests_total` и потоком Loki? (На Docker-стенде — мало; в k8s — `pod`, `namespace` — см. [15-k8s-servicemonitor.md](15-k8s-servicemonitor.md).)

## Задание 5. *Опционально* — панель на дашборде

Dashboard → Add panel → datasource Loki → logs panel с запросом:

```logql
{container=~"mock-(prometheus|demo-app)"}
```

Рядом time series из Prometheus на том же dashboard.

## Ожидаемый результат

| Проверка | Критерий |
|----------|----------|
| Loki ready | HTTP 200 на `/ready` |
| Explore | Видны потоки с label `container` |
| LogQL | Выполнены ≥4 запроса (файл примеров + свои) |
| Корреляция | Описано в 2–3 предложениях в заметках |

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| No data | Overlay не поднят; Promtail не видит socket |
| Unknown job | В Promtail `job_name: docker` — в запросе `{job="docker"}` |
| Grafana no Loki | Datasource provisioning; перезапуск grafana |

## Чек-лист

- [ ] Overlay logs запущен
- [ ] Explore Loki работает
- [ ] Metric query `rate({...}[5m])` построен

**Дальше:** [05. Promtail pipelines](05-promtail-pipelines.md).
