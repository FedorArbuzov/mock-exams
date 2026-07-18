# 17. Мониторинг Kafka: lag, метрики, алерты

## Введение: «всё зелёное, а заказы стоят час»

Grafana показывает CPU broker 40%, а бизнес жалуется на задержку. **Consumer lag** — главный сигнал «поток не успевают обрабатывать». Intermediate — что смотреть оператору кроме «брокер жив».

## Что вы узнаете

- **Consumer lag** (per partition, per group).
- **LOG-END** vs **CURRENT-OFFSET**.
- JMX / **Kafka Exporter** / UI (обзор).
- Broker metrics: **UnderReplicatedPartitions**, **OfflineReplicas**, **ActiveControllerCount**.
- **Disk**, **network**, **request handler idle**.
- Алерты и runbook «lag растёт».

---

## Consumer lag

```text
LAG = LOG-END-OFFSET - CURRENT-OFFSET   (упрощённо, по partition)
```

| Ситуация | Интерпретация |
|----------|----------------|
| LAG растёт стабильно | consumer медленнее producer |
| LAG скачок и падение | rebalance / новый member |
| LAG только на partition 2 | hot partition или stuck consumer |

CLI:

```bash
kafka-consumer-groups.sh --describe --group my-app
```

## Kafka UI

На cluster: [http://localhost:8080](http://localhost:8080) — топики, groups, lag визуально.

## Broker health

| Метрика | Значение |
|---------|----------|
| `UnderReplicatedPartitions` | >0 долго — проблема ISR/диска/сети |
| `OfflineReplicas` | реплика недоступна |
| `ActiveControllerCount` | должно быть **1** на кластер |
| `RequestHandlerAvgIdlePercent` | низкий — broker перегружен |

## Producer / consumer client metrics

- Producer: `record-error-rate`, `request-latency-max`
- Consumer: `records-lag-max`, `commit-latency-avg`

Экспорт: Prometheus **kafka_exporter**, JMX agent, Confluent Metrics.

## Диск и retention

Рост размера topic, `log.retention.bytes/ms`, **disk full** — broker перестаёт принимать produce.

## Алерты (минимальный набор)

1. **max lag** по критичным group > порога N минут.
2. **UnderReplicatedPartitions** > 0.
3. **OfflinePartitions** > 0.
4. Disk usage > 85% на брокере.

## Runbook: lag растёт

1. `describe --group` — какие partition?
2. Consumer жив? CPU? GC? `max.poll.interval` exceptions?
3. Hot key? — см. [21-capacity](21-capacity.md).
4. Producer spike? — rate limit, scale consumers.
5. Broker issue? — ISR, disk.

## На стенде

Используйте cluster + лабу [18](18-lab-lag-drill.md).

## Типичные ошибки

| Ошибка | Причина |
|--------|---------|
| Смотреть только broker CPU | lag в consumer |
| Алерт на мгновенный lag spike | ложные срабатывания при deploy |
| Игнор одной partition | локальный stuck |
| Нет метрик internal topics | Connect/txn/coordinator слепая зона |

## В продакшене

- Dashboard: lag top-N groups, UR partitions, disk per broker.
- SLO: p99 **end-to-end latency** (event time → processed).
- Корреляция с deploy (annotations).

## Резюме

Мониторинг Kafka = **lag + репликация + диск + latency запросов**; UI и CLI — первый инструмент, Prometheus — постоянный.

## Чек-лист

- [ ] Считаете lag по partition.
- [ ] Назвали 3 broker-метрики для алерта.
- [ ] Знаете шаги runbook при росте lag.

**Дальше:** [18. Лаба: lag drill](18-lab-lag-drill.md).
