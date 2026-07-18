# 23. Операции: alter topic, reassignment, maintenance

## Введение: «нужно срочно увеличить retention на prod»

Изменение конфигурации topic, добавление partition, **rolling restart** брокеров — ежедневная работа платформенной команды. Intermediate — безопасные **alter**, ограничения **увеличения partition**, preview **partition reassignment**.

## Что вы узнаете

- **`kafka-configs.sh`** — alter/describe topic и broker.
- **`kafka-topics.sh --alter`** — partitions, RF (ограничения).
- **Rolling restart** брокеров в KRaft cluster.
- **Preferred leader election** (обзор).
- **Partition reassignment** (обзор).
- Runbook: плановое обслуживание.

---

## Alter конфигурации topic

Динамические конфиги (без рестарта broker):

```bash
kafka-configs.sh --bootstrap-server $BS \
  --entity-type topics --entity-name my-topic \
  --alter --add-config retention.ms=604800000
```

Полезные ключи:

| Config | Назначение |
|--------|------------|
| `retention.ms` | время хранения |
| `retention.bytes` | размер на partition |
| `compression.type` | producer/broker |
| `min.insync.replicas` | override на topic |
| `max.message.bytes` | крупные сообщения |

Describe:

```bash
kafka-configs.sh ... --describe --entity-type topics --entity-name my-topic
```

## Увеличение partition

```bash
kafka-topics.sh --alter --topic orders --partitions 12
```

**Важно:** новые partition **пустые**; key routing для **старых** key не меняется. Consumer с новыми partition — rebalance; **порядок по key** сохраняется только внутри старой partition id.

Уменьшить partition count **нельзя** без миграции.

## Изменение RF

Только **увеличение** через reassignment tool; уменьшение — тоже reassignment. На учебном кластере RF=3 уже.

## Rolling restart broker (KRaft)

1. Проверить **UnderReplicatedPartitions = 0**.
2. `docker stop mock-kafka-2` → дождаться ISR healthy → `docker start`.
3. Повторить для каждого брокера.
4. Следить **ActiveController** — один controller.

Не останавливайте **большинство** брокеров одновременно.

## Preferred leader election

После restart leader может «уехать» не на preferred replica:

```bash
kafka-leader-election.sh --bootstrap-server $BS \
  --election-type preferred --all-topic-partitions
```

(На стенде — опционально, если утилита доступна в образе.)

## Partition reassignment (preview)

`kafka-reassign-partitions.sh` + JSON plan — перенос replica на другие broker (балансировка диска). Долгая операция; throttle `leader.replication.throttled.rate`.

## Плановое обслуживание

1. Announce maintenance window.
2. Проверить lag критичных groups.
3. Rolling brokers one-by-one.
4. Post-check: UR=0, produce smoke test.

## Типичные ошибки

| Ошибка | Причина |
|--------|---------|
| Увеличили partition в пик lag | усугубили rebalance |
| retention↓ без оценки диска | delete storm |
| Остановили 2 из 3 брокеров | min ISR, недоступность |
| Alter RF без reassignment | команда не сработает как ожидали |

## В продакшене

- Git-tracked topic configs (Terraform/operator).
- Strimzi `KafkaTopic` CR — глава [25](25-strimzi-k8s.md).
- Change management + rollback plan.

## Резюме

Операции Kafka — **изменить конфиг**, **расширить partition осознанно**, **катить брокеров по одному**, тяжёлое — **reassignment**.

## Чек-лист

- [ ] Умеете alter/describe config topic.
- [ ] Знаете ограничение alter partitions.
- [ ] Описали rolling restart в 3 шага.

**Дальше:** [24. Лаба: alter topic](24-lab-alter-topic.md).
