# 03. Лаба: первый индекс, документ и _id

## Цель лабы

Поднять стенд OpenSearch, создать **индекс** с явными settings, проиндексировать **документ** через `POST` и `PUT`, прочитать по **`_id`**, увидеть метаданные в ответе `_search`.

## Предварительно

- Docker, **2+ ГБ RAM** для контейнера OpenSearch.
- Из корня репозитория:

```bash
cd deploy/opensearch
docker compose up -d
docker compose ps
bash scripts/smoke.sh
```

Подробности: [`deploy/opensearch/README.md`](../../deploy/opensearch/README.md).  
Теория: [02. Архитектура](02-architecture.md).

---

## Задание 1. Health и версия

**Зачем:** убедиться, что API доступен без auth.

```bash
curl -s http://localhost:9200/_cluster/health?pretty
curl -s http://localhost:9200/ | head -20
```

**Что увидите:** `"status" : "green"` или `"yellow"`; в корневом ответе — `version.number` (2.x).

---

## Задание 2. Создать индекс `lab-first`

**Зачем:** задать **1 shard, 0 replicas** для single-node.

```bash
curl -s -X PUT "http://localhost:9200/lab-first" \
  -H 'Content-Type: application/json' -d '{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0
  }
}'
```

Проверка:

```bash
curl -s -I http://localhost:9200/lab-first
curl -s "http://localhost:9200/_cat/indices/lab-first?v"
```

**Что увидите:** `acknowledged: true`; в cat — один индекс `lab-first`, `health` green.

---

## Задание 3. POST — автогенерация _id

**Зачем:** типичный путь ingest без заранее известного id.

```bash
curl -s -X POST "http://localhost:9200/lab-first/_doc" \
  -H 'Content-Type: application/json' -d '{
  "@timestamp": "2026-05-18T12:00:00Z",
  "level": "info",
  "message": "lab started"
}'
```

Сохраните из ответа поля **`_id`** и **`_version`**.

**Что увидите:** `"result" : "created"`, случайный `_id` (например base64-подобная строка).

---

## Задание 4. PUT — фиксированный _id

**Зачем:** идемпотентная запись по бизнес-ключу.

```bash
curl -s -X PUT "http://localhost:9200/lab-first/_doc/event-001" \
  -H 'Content-Type: application/json' -d '{
  "@timestamp": "2026-05-18T12:01:00Z",
  "level": "warn",
  "message": "disk 80%"
}'

curl -s "http://localhost:9200/lab-first/_doc/event-001?pretty"
```

Повторите тот же `PUT` с другим `message`.

**Что увидите:** второй вызов — `"result" : "updated"`, `_version` увеличился; `_source` обновился.

---

## Задание 5. GET и _search

```bash
curl -s -X POST "http://localhost:9200/lab-first/_refresh"

curl -s -X GET "http://localhost:9200/lab-first/_search?pretty" \
  -H 'Content-Type: application/json' -d '{"query":{"match_all":{}},"size":10}'
```

**Что увидите:** `hits.total` ≥ 2; в каждом hit — `_index`, `_id`, `_score`, `_source`.

---

## Задание 6. Dashboards (опционально)

1. Откройте [http://localhost:5601](http://localhost:5601).
2. **Management → Index Patterns** → Create `lab-first`, time field `@timestamp` (если предложит).
3. **Discover** — убедитесь, что документы видны.

---

## Задание 7. Удаление документа

```bash
curl -s -X DELETE "http://localhost:9200/lab-first/_doc/event-001"
curl -s "http://localhost:9200/lab-first/_doc/event-001?pretty"
```

**Что увидите:** `"found" : false` при GET.

---

## Критерии успеха

- [ ] `_cluster/health` отвечает без ошибки auth
- [ ] Индекс `lab-first` создан с 1 shard / 0 replicas
- [ ] POST вернул `_id`, GET по нему находит документ
- [ ] PUT с явным `_id` обновляет `_version`
- [ ] `_search` с `match_all` возвращает оставшиеся документы

## Что унести в работу

- **POST** — auto `_id`; **PUT** — свой `_id` для upsert
- После записи для тестов — **`_refresh`** или подождать ~1s
- Метаданные hit: **`_index`**, **`_id`**, **`_source`**

Следующий урок: [04. Mapping и analyzers](04-mapping-analyzers.md).
