# 06. Лаба: ISM — политика, ускоренное удаление, обзор rollover

## Подготовка

```bash
cd deploy/opensearch && docker compose up -d
curl -s http://localhost:9200/_cluster/health?pretty | grep status
```

Рекомендуется template `logs-app` из [02-lab-templates.md](02-lab-templates.md).

## Задание 1. Создать ISM policy

```bash
curl -s -X PUT "http://localhost:9200/_plugins/_ism/policies/lab-logs-delete" \
  -H 'Content-Type: application/json' \
  -d @deploy/opensearch/examples/ism-logs-policy.json
```

Проверка:

```bash
curl -s "http://localhost:9200/_plugins/_ism/policies/lab-logs-delete?pretty" | head -40
```

**Что увидите:** policy id `lab-logs-delete`, states `hot` и `delete`, template на `logs-app-*`.

> Имя policy в URL (`lab-logs-delete`) может отличаться от внутреннего `_id` в ответе — ориентируйтесь на ответ API.

## Задание 2. Индекс «старше политики»

Для быстрой проверки создайте политику **`lab-logs-fast`** — копия эталона с `min_index_age: "1m"`:

```bash
curl -s -X PUT "http://localhost:9200/_plugins/_ism/policies/lab-logs-fast" \
  -H 'Content-Type: application/json' \
  -d '{
  "policy": {
    "description": "Lab: delete after 1 minute",
    "default_state": "hot",
    "states": [
      {
        "name": "hot",
        "actions": [],
        "transitions": [{ "state_name": "delete", "conditions": { "min_index_age": "1m" } }]
      },
      { "name": "delete", "actions": [{ "delete": {} }], "transitions": [] }
    ],
    "ism_template": [{ "index_patterns": ["logs-lab-fast-*"], "priority": 110 }]
  }
}'
```

Создайте индекс и документ:

```bash
curl -s -X PUT "http://localhost:9200/logs-lab-fast-001" \
  -H 'Content-Type: application/json' \
  -d '{"settings":{"number_of_shards":1,"number_of_replicas":0}}'
curl -s -X POST "http://localhost:9200/logs-lab-fast-001/_doc" \
  -H 'Content-Type: application/json' \
  -d '{"@timestamp":"2026-05-18T12:00:00Z","message":"ism test"}'
```

Через 2–5 минут:

```bash
curl -s "http://localhost:9200/_plugins/_ism/explain/logs-lab-fast-001?pretty"
curl -s -o /dev/null -w "%{http_code}" "http://localhost:9200/logs-lab-fast-001"
```

**Что увидите:** в `explain` — переход в `delete`; HTTP **404** на индекс (удалён).

## Задание 3. Эталонная политика 7d на `logs-app-*`

```bash
bash deploy/opensearch/scripts/bulk-sample.sh
IDX=$(date +%Y%m%d)
curl -s "http://localhost:9200/_plugins/_ism/explain/logs-app-${IDX}?pretty"
```

**Что увидите:** индекс в состоянии `hot`, policy `lab-logs-delete` (или привязанная по template), transition с `min_index_age: "7d"`.

Не ждите 7 дней на лабе — достаточно скриншота `explain`.

## Задание 4. Tabletop: rollover (без выполнения на single-node)

Опишите в 5–8 предложениях сценарий **rollover**:

1. Alias `logs-app-write` → индекс `logs-app-000001`.
2. Условие rollover: `max_primary_shard_size: 10gb` или `max_age: 1d`.
3. После rollover запись идёт в `logs-app-000002`.
4. ISM переводит `000001` в warm/delete.

Полезные API (справочно, не обязательны на стенде):

```text
POST logs-app-write/_rollover
PUT  _index_template/...  →  "rollover_alias": "logs-app-write"
```

Связь с Kafka: при burst логов **rollover** срабатывает раньше календарного дня — см. [kafka-intermediate/21-capacity](../kafka-intermediate/21-capacity.md).

## Задание 5. Dashboards Index Management

**OpenSearch Dashboards → Index Management → Indices** — найдите `logs-app-*`, колонка **State** / **Managed by policy**.

## Очистка

```bash
curl -s -X DELETE "http://localhost:9200/_plugins/_ism/policies/lab-logs-fast"
curl -s -X DELETE "http://localhost:9200/_plugins/_ism/policies/lab-logs-delete"
```

(Удаление policy не восстанавливает уже удалённые индексы.)

## Итог

- ISM автоматизирует **delete** (и другие actions) по возрасту индекса.
- `ism_template` связывает policy с `logs-app-*`.
- Rollover — отдельный механизм для **write alias**, дополняет ISM в prod.

**Дальше:** [07-shards-replicas.md](07-shards-replicas.md).
