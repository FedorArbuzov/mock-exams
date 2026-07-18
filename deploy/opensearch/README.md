# OpenSearch для курсов opensearch-*

Локальный стенд: **OpenSearch 2.x** (single-node) + **OpenSearch Dashboards**.

Курсы: [opensearch-basic](../../courses/opensearch-basic/README.md), [opensearch-intermediate](../../courses/opensearch-intermediate/README.md).

## Запуск

```bash
cd deploy/opensearch
docker compose up -d
docker compose ps
```

| Сервис | URL |
|--------|-----|
| OpenSearch API | [http://localhost:9200](http://localhost:9200) |
| Dashboards | [http://localhost:5601](http://localhost:5601) |

Дождитесь **healthy** у `mock-opensearch` (40–90 с на первом старте).

**Ресурсы:** выделите Docker **2+ ГБ RAM**; `OPENSEARCH_JAVA_OPTS` по умолчанию 512m heap.

## Smoke test

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

## Пример bulk-логов

```bash
bash scripts/bulk-sample.sh
curl -s "http://localhost:9200/logs-app-*/_search?q=level:error&pretty"
```

## Без security (только лаб)

`DISABLE_SECURITY_PLUGIN=true` — упрощает `curl` без TLS/пароля. **В продакшене** — Fine-Grained Access Control, TLS, роли.

## Полезные API

```bash
curl -s http://localhost:9200/_cat/indices?v
curl -s http://localhost:9200/_cluster/health?pretty
curl -s -X GET "http://localhost:9200/logs-*/_search" -H 'Content-Type: application/json' -d '{"size":5,"sort":[{"@timestamp":"desc"}]}'
```

## Сброс

```bash
docker compose down -v
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| Dashboards не открывается | `docker compose logs opensearch-dashboards`, дождаться green/yellow |
| `cluster_block_exception` read-only | диск Docker заполнен — `docker system df`, `down -v` |
| OOMKilled opensearch | увеличьте RAM или уменьшите heap в compose |
| `max virtual memory areas vm.max_map_count` (Linux) | `sudo sysctl -w vm.max_map_count=262144` |

## Связанные стенды

- Метрики и Loki: [deploy/observability](../observability/README.md)
- Поток событий: [deploy/kafka](../kafka/README.md)
