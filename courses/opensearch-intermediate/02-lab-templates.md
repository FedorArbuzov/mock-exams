# 02. Лаба: index template для `logs-app-*`

## Подготовка

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
```

API: `http://localhost:9200`. При необходимости сбросьте данные: `docker compose down -v` и снова `up -d`.

## Задание 1. Установить composable template

Из корня репозитория:

```bash
curl -s -X PUT "http://localhost:9200/_index_template/logs-app" \
  -H 'Content-Type: application/json' \
  -d @courses/opensearch-intermediate/examples/index-template-logs.json
```

Проверка:

```bash
curl -s "http://localhost:9200/_index_template/logs-app?pretty"
```

**Что увидите:** шаблон `logs-app` с `index_patterns: ["logs-app-*"]`, `priority: 200`, mappings для `@timestamp`, `level`, `service`, …

## Задание 2. Создать индекс через bulk

```bash
bash deploy/opensearch/scripts/bulk-sample.sh
IDX=$(date +%Y%m%d)
curl -s "http://localhost:9200/logs-app-${IDX}/_mapping?pretty"
```

**Что увидите:** типы полей совпадают с template (`level` — `keyword`, `@timestamp` — `date`), а не только угаданные dynamic types.

Сравните с контрольным индексом **без** template:

```bash
curl -s -X PUT "http://localhost:9200/raw-no-template" -H 'Content-Type: application/json' \
  -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'
curl -s -X POST "http://localhost:9200/raw-no-template/_doc" -H 'Content-Type: application/json' \
  -d '{"@timestamp":"2026-05-18T10:00:00Z","level":"info","message":"GET /health 200"}'
curl -s "http://localhost:9200/raw-no-template/_mapping?pretty"
```

Зафиксируйте в отчёте: для `message` и `level` mapping может отличаться от `logs-app-*`.

## Задание 3. Поиск и фильтр по keyword

```bash
curl -s "http://localhost:9200/logs-app-*/_search" -H 'Content-Type: application/json' -d '{
  "size": 5,
  "query": { "bool": {
    "filter": [
      { "term": { "level": "error" } }
    ]
  }},
  "sort": [{ "@timestamp": "desc" }]
}' | head -c 2000
```

**Что увидите:** документ с `GET /orders 500` и `level: error` из bulk-sample.

## Задание 4. Alias (опционально)

Создайте alias для записи в «текущий» дневной индекс:

```bash
TODAY="logs-app-$(date +%Y%m%d)"
curl -s -X POST "http://localhost:9200/_aliases" -H 'Content-Type: application/json' -d "{
  \"actions\": [
    { \"add\": { \"index\": \"$TODAY\", \"alias\": \"logs-app-write\" } }
  ]
}"
curl -s "http://localhost:9200/_cat/aliases?v"
```

В продакшене ingest (Logstash, Fluent Bit, Kafka Connect sink) часто пишет в **alias** `logs-app-write`, а ISM переводит старые backing indices — здесь достаточно понимания идеи.

## Задание 5. Dashboards (визуальная проверка)

1. Откройте http://localhost:5601  
2. **Management → Dashboards Management → Index patterns** (или Stack Management → Index patterns).  
3. Создайте pattern `logs-app-*`, time field — `@timestamp`.  
4. **Discover** — убедитесь, что поля `level`, `service`, `status` видны как filterable.

## Очистка (опционально)

```bash
curl -s -X DELETE "http://localhost:9200/logs-app-*"
curl -s -X DELETE "http://localhost:9200/raw-no-template"
curl -s -X DELETE "http://localhost:9200/_index_template/logs-app"
```

## Итог лабы

- Template задаёт контракт схемы **до** первого документа.
- Daily index `logs-app-YYYYMMDD` сочетается с ISM ([06-lab-ism-rollover.md](06-lab-ism-rollover.md)).
- Следующий шаг — обогащение полей в **ingest pipeline** ([04-lab-ingest-pipeline.md](04-lab-ingest-pipeline.md)).
