# 08. Лаба: здоровье кластера и шарды

## Подготовка

```bash
cd deploy/opensearch
docker compose up -d
bash scripts/smoke.sh
```

## Задание 1. Cluster health

```bash
curl -s "http://localhost:9200/_cluster/health?pretty"
curl -s "http://localhost:9200/_cluster/health?level=indices&pretty" | head -60
```

Запишите: `status`, `number_of_nodes`, `active_primary_shards`, `relocating_shards`, `unassigned_shards`.

**Что увидите:** на чистом стенде обычно **yellow** (single-node, реплики не назначены) или **green** при всех индексах с `replicas: 0` и корректной интерпретации — ориентируйтесь на `unassigned_shards: 0` для primary.

## Задание 2. Cat API

```bash
curl -s "http://localhost:9200/_cat/nodes?v"
curl -s "http://localhost:9200/_cat/indices?v&s=index"
curl -s "http://localhost:9200/_cat/shards?v" | head -30
curl -s "http://localhost:9200/_cat/allocation?v"
```

**Что увидите:** одна нода `opensearch`, индексы `logs-app-*`, `smoke-test`; в shards — `STARTED`, pri/rep колонки.

## Задание 3. Индекс с replica=1 на одной ноде

```bash
curl -s -X PUT "http://localhost:9200/lab-replica-test" -H 'Content-Type: application/json' -d '{
  "settings": { "number_of_shards": 1, "number_of_replicas": 1 }
}'
sleep 3
curl -s "http://localhost:9200/_cat/shards/lab-replica-test?v"
curl -s "http://localhost:9200/_cluster/health?pretty" | grep -E 'status|unassigned'
```

**Что увидите:** replica shard **UNASSIGNED**, `unassigned_shards` ≥ 1, cluster **yellow**.

Объясните в отчёте, почему replica не назначилась.

## Задание 4. Вернуть green для тестового индекса

```bash
curl -s -X PUT "http://localhost:9200/lab-replica-test/_settings" -H 'Content-Type: application/json' \
  -d '{"index":{"number_of_replicas":0}}'
curl -s "http://localhost:9200/_cat/shards/lab-replica-test?v"
```

**Что увидите:** одна primary, replica 0 — unassigned исчезает.

## Задание 5. Нагрузка и размер индексов

```bash
for i in $(seq 1 50); do
  bash deploy/opensearch/scripts/bulk-sample.sh 2>/dev/null || true
done
curl -s "http://localhost:9200/_cat/indices/logs-app-*?v&h=index,docs.count,store.size"
```

Сопоставьте с [07-shards-replicas.md](07-shards-replicas.md): один шард на индекс, рост `store.size`.

## Задание 6. Tabletop: red cluster

Без выполнения на стенде опишите сценарий **red**:

1. Потеря data-ноды с единственной primary без replica.
2. `_cluster/health` → `status: red`, поиск по затронутым индексам частично недоступен.
3. Действия: восстановить ноду, restore snapshot, reindex — **не** «просто restart Dashboards».

Связь: при **Kafka** lag indexer отстаёт, но кластер остаётся yellow/green — проблема в consumer, не в shard allocation ([kafka-intermediate/18-lab-lag-drill](../kafka-intermediate/18-lab-lag-drill.md)).

## Очистка

```bash
curl -s -X DELETE "http://localhost:9200/lab-replica-test"
```

## Итог

- `_cluster/health` и `_cat/*` — ежедневные инструменты SRE.
- Yellow на одной ноде с `replicas: 1` — ожидаемое поведение.
- Red — приоритет инцидента.

**Дальше:** [09-security-overview.md](09-security-overview.md).
