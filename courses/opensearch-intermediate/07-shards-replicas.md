# 07. Шарды, реплики и routing

## Индекс внутри: шарды Lucene

Логический **индекс** OpenSearch — набор **primary shards** (каждый — отдельный Lucene index на диске). Документ попадает в шард по хешу `_routing` (по умолчанию `_id`):

```text
shard_num = hash(_routing) % number_of_primary_shards
```

После создания индекса **`number_of_shards` не меняется** без reindex/split/shrink (операции тяжёлые). Поэтому шард планируют **до** первого production-трафика.

## Сколько шардов на логи

Правило большого пальца (не догма): один шард primary — **20–50 ГБ** данных при поисковой нагрузке; для time-series иногда **меньше** шардов и **больше** индексов (daily).

| Ситуация | Рекомендация на lab / малый кластер |
|----------|-------------------------------------|
| Single-node, учебные логи | `number_of_shards: 1` |
| Терабайты в сутки | Несколько шардов **или** rollover на новые индексы |
| Слишком много мелких шардов | Overhead на cluster state и merge |

На стенде template задаёт **1 shard** — достаточно для `bulk-sample` и Discover.

## Реплики

**Replica shard** — копия primary на **другой** ноде. Даёт:

- чтение при `green` (распределение search);
- отказоустойчивость при падении ноды.

| `number_of_replicas` | Single-node |
|----------------------|-------------|
| `0` | Индекс может быть **yellow** (нет реплик) — **норма** для lab |
| `1` | Нужно **≥2** data nodes, иначе replica **unassigned** → yellow |

В [`deploy/opensearch/docker-compose.yml`](../../deploy/opensearch/docker-compose.yml) одна нода — в template и smoke-тестах **replicas: 0**.

## Состояния кластера

| Status | Значение |
|--------|----------|
| **green** | Все primary и replica assigned |
| **yellow** | Все primary есть, не все replica (или replicas=0 на одной ноде — часто yellow) |
| **red** | Хотя бы один primary **unassigned** — потеря или недоступность данных шарда |

`active_shards_percent_as_number` в `_cluster/health` — быстрый KPI.

## Allocation и диск

При заполнении диска watermark (`flood_stage`) кластер ставит **read-only block** на индексы — см. troubleshooting в [deploy/opensearch/README.md](../../deploy/opensearch/README.md). Это не «баг ISM», а защита от коррупции.

Linux-хост: `vm.max_map_count` для JVM OpenSearch — в README стенда.

## Kafka и ingest нагрузка

Producer'ы в Kafka масштабируются по partition; **indexer** в OpenSearch должен успевать bulk'ить. Узкие места:

- слишком много мелких bulk;
- тяжёлый ingest Grok на координаторе;
- refresh_interval слишком агрессивный (`1s` vs `30s`).

Метрики lag в Kafka — [kafka-intermediate/17-monitoring](../kafka-intermediate/17-monitoring.md); размер индексов — `_cat/indices` и ISM.

## Multi-node (обзор)

В Kubernetes OpenSearch часто идёт как StatefulSet ([kuber-intermediate/01-statefulset](../kuber-intermediate/01-statefulset.md)): стабильные имена pod'ов, PVC на шард. Zone awareness: `awareness.attributes: zone` и `routing.allocation.awareness.attributes` — реплики в разных AZ.

## Чек-лист

- [ ] Объясняете разницу **primary** и **replica**.
- [ ] Понимаете, почему на single-node `replicas: 0`.
- [ ] Знаете, что red = потеря primary, а не «просто yellow».

**Дальше:** [08. Лаба: здоровье кластера](08-lab-cluster-health.md).
