# 17. Kafka monitoring: lag, metrics, alerts

## Intro: "everything is green, but orders have been stuck for an hour"

Grafana shows broker CPU at 40%, yet the business complains about a delay. **Consumer lag** is the main signal of "the stream can't keep up with processing". At the intermediate level — what an operator should watch beyond "the broker is alive".

## What you'll learn

- **Consumer lag** (per partition, per group).
- **LOG-END** vs **CURRENT-OFFSET**.
- JMX / **Kafka Exporter** / UI (overview).
- Broker metrics: **UnderReplicatedPartitions**, **OfflineReplicas**, **ActiveControllerCount**.
- **Disk**, **network**, **request handler idle**.
- Alerts and the "lag is growing" runbook.

---

## Consumer lag

```text
LAG = LOG-END-OFFSET - CURRENT-OFFSET   (simplified, per partition)
```

| Situation | Interpretation |
|----------|----------------|
| LAG grows steadily | the consumer is slower than the producer |
| LAG spikes and drops | rebalance / a new member |
| LAG only on partition 2 | a hot partition or a stuck consumer |

CLI:

```bash
kafka-consumer-groups.sh --describe --group my-app
```

## Kafka UI

On the cluster: [http://localhost:8080](http://localhost:8080) — topics, groups, lag visually.

## Broker health

| Metric | Meaning |
|---------|----------|
| `UnderReplicatedPartitions` | >0 for a long time — an ISR/disk/network problem |
| `OfflineReplicas` | a replica is unavailable |
| `ActiveControllerCount` | should be **1** per cluster |
| `RequestHandlerAvgIdlePercent` | low — the broker is overloaded |

## Producer / consumer client metrics

- Producer: `record-error-rate`, `request-latency-max`
- Consumer: `records-lag-max`, `commit-latency-avg`

Export: Prometheus **kafka_exporter**, a JMX agent, Confluent Metrics.

## Disk and retention

Growth of the topic size, `log.retention.bytes/ms`, **disk full** — the broker stops accepting produce.

## Alerts (minimal set)

1. **max lag** for critical groups > a threshold of N minutes.
2. **UnderReplicatedPartitions** > 0.
3. **OfflinePartitions** > 0.
4. Disk usage > 85% on a broker.

## Runbook: lag is growing

1. `describe --group` — which partitions?
2. Is the consumer alive? CPU? GC? `max.poll.interval` exceptions?
3. A hot key? — see [21-capacity](21-capacity.md).
4. A producer spike? — rate limit, scale consumers.
5. A broker issue? — ISR, disk.

## On the stand

Use the cluster + lab [18](18-lab-lag-drill.md).

## Common mistakes

| Mistake | Cause |
|--------|---------|
| Watching only broker CPU | the lag is in the consumer |
| Alerting on an instantaneous lag spike | false positives during a deploy |
| Ignoring one partition | a local stuck |
| No metrics for internal topics | Connect/txn/coordinator blind spot |

## In production

- Dashboard: lag for top-N groups, UR partitions, disk per broker.
- SLO: p99 **end-to-end latency** (event time → processed).
- Correlation with deploys (annotations).

## Summary

Kafka monitoring = **lag + replication + disk + request latency**; the UI and CLI are the first tool, Prometheus is the permanent one.

## Checklist

- [ ] You can compute lag per partition.
- [ ] You named 3 broker metrics to alert on.
- [ ] You know the runbook steps when lag grows.

**Next:** [18. Lab: lag drill](18-lab-lag-drill.md).
