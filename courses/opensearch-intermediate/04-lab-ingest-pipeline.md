# 04. Лаба: ingest pipeline (Grok + Set)

## Подготовка

Стенд запущен, template из [02-lab-templates.md](02-lab-templates.md) установлен (рекомендуется).

```bash
cd deploy/opensearch && docker compose ps
```

## Задание 1. Зарегистрировать pipeline

```bash
curl -s -X PUT "http://localhost:9200/_ingest/pipeline/nginx-parse" \
  -H 'Content-Type: application/json' \
  -d @deploy/opensearch/examples/ingest-pipeline-nginx.json
```

Проверка:

```bash
curl -s "http://localhost:9200/_ingest/pipeline/nginx-parse?pretty"
```

**Что увидите:** два processor'а — `grok` по `message`, затем `set` поля `parsed: true`.

## Задание 2. Simulate без записи в индекс

```bash
curl -s -X POST "http://localhost:9200/_ingest/pipeline/nginx-parse/_simulate" \
  -H 'Content-Type: application/json' \
  -d '{
  "docs": [
    { "_source": { "message": "GET /health 200" } },
    { "_source": { "message": "not matching pattern" } }
  ]
}' | head -c 3000
```

**Что увидите:** первый doc с полями `method`, `path`, `status`, `parsed`; второй — ошибка Grok (в отчёте опишите `error` в ответе simulate).

## Задание 3. Bulk с pipeline

```bash
IDX="logs-app-$(date +%Y%m%d)"
curl -s -X POST "http://localhost:9200/_bulk?pipeline=nginx-parse" \
  -H 'Content-Type: application/x-ndjson' --data-binary @- <<EOF
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T11:00:01Z","level":"info","service":"api","message":"GET /health 200"}
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T11:00:02Z","level":"error","service":"api","message":"POST /orders 500"}
EOF

curl -s -X POST "http://localhost:9200/$IDX/_refresh"
curl -s "http://localhost:9200/$IDX/_search" -H 'Content-Type: application/json' -d '{
  "query": { "term": { "parsed": true } },
  "_source": ["message","method","path","status","parsed"]
}' | head -c 2500
```

**Что увидите:** из `message` извлечены `method`, `path`, `status`; `parsed: true` для успешно разобранных строк.

## Задание 4. Конфликт: status уже в документе

Добавьте документ, где в JSON уже есть `status`, а Grok тоже пишет в `status`:

```bash
curl -s -X POST "http://localhost:9200/_bulk?pipeline=nginx-parse" \
  -H 'Content-Type: application/x-ndjson' --data-binary @- <<EOF
{"index":{"_index":"$IDX"}}
{"@timestamp":"2026-05-18T11:00:03Z","level":"warn","service":"api","message":"GET /pay 402","status":999}
EOF
```

Откройте `_source` в Discover. **Вопрос для отчёта:** какое значение `status` осталось и почему (порядок processors, override)?

## Задание 5. Default pipeline в template (опционально)

Обновите template, добавив в `settings`:

```json
"index.default_pipeline": "nginx-parse"
```

Пересоздайте **новый** дневной индекс (другая дата в имени или удалите старый) и проиндексируйте **без** `?pipeline=` — pipeline должен примениться автоматически.

## Задание 6. Dashboards

В **Discover** по pattern `logs-app-*`:

- фильтр `parsed: true`;
- колонки `method`, `path`, `status`;
- сохранённый search «Parsed nginx lines».

## Сбой намеренно (опционально)

Добавьте в pipeline `on_failure`:

```json
"on_failure": [
  {
    "set": {
      "field": "parse_error",
      "value": true
    }
  }
]
```

Проиндексируйте строку с несовпадающим `message`. **Что увидите:** документ сохранён с `parse_error`, а не потерян целиком.

## Итог

- Grok извлекает структуру из текстового `message`.
- Set маркирует успешный разбор или ошибку.
- Pipeline подключается query-параметром или default в template.

**Дальше:** жизненный цикл индексов — [05-index-lifecycle-ism.md](05-index-lifecycle-ism.md).
