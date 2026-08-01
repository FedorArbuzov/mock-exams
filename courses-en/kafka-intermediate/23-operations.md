# 23. Operations: alter topic, reassignment, maintenance

## Intro: "we urgently need to increase retention on prod"

Changing a topic's configuration, adding partitions, a **rolling restart** of brokers — the daily work of the platform team. At the intermediate level — safe **alter**, the limitations of **increasing partitions**, a preview of **partition reassignment**.

## What you'll learn

- **`kafka-configs.sh`** — alter/describe of topic and broker.
- **`kafka-topics.sh --alter`** — partitions, RF (limitations).
- **Rolling restart** of brokers in a KRaft cluster.
- **Preferred leader election** (overview).
- **Partition reassignment** (overview).
- Runbook: planned maintenance.

---

## Alter a topic's configuration

Dynamic configs (without a broker restart):

```bash
kafka-configs.sh --bootstrap-server $BS \
  --entity-type topics --entity-name my-topic \
  --alter --add-config retention.ms=604800000
```

Useful keys:

| Config | Purpose |
|--------|------------|
| `retention.ms` | retention time |
| `retention.bytes` | size per partition |
| `compression.type` | producer/broker |
| `min.insync.replicas` | override on the topic |
| `max.message.bytes` | large messages |

Describe:

```bash
kafka-configs.sh ... --describe --entity-type topics --entity-name my-topic
```

## Increasing partitions

```bash
kafka-topics.sh --alter --topic orders --partitions 12
```

**Important:** the new partitions are **empty**; key routing for **old** keys doesn't change. A consumer with the new partitions — a rebalance; **per-key ordering** is preserved only within the old partition id.

You **cannot** reduce the partition count without a migration.

## Changing RF

Only **increasing** via the reassignment tool; decreasing — also reassignment. On the training cluster RF=3 already.

## Rolling restart of a broker (KRaft)

1. Check **UnderReplicatedPartitions = 0**.
2. `docker stop mock-kafka-2` → wait for a healthy ISR → `docker start`.
3. Repeat for each broker.
4. Watch the **ActiveController** — a single controller.

Don't stop a **majority** of brokers at the same time.

## Preferred leader election

After a restart the leader can "move" off the preferred replica:

```bash
kafka-leader-election.sh --bootstrap-server $BS \
  --election-type preferred --all-topic-partitions
```

(On the stand — optional, if the utility is available in the image.)

## Partition reassignment (preview)

`kafka-reassign-partitions.sh` + a JSON plan — moving replicas to other brokers (disk balancing). A long operation; throttle with `leader.replication.throttled.rate`.

## Planned maintenance

1. Announce a maintenance window.
2. Check the lag of critical groups.
3. Roll brokers one-by-one.
4. Post-check: UR=0, a produce smoke test.

## Common mistakes

| Mistake | Cause |
|--------|---------|
| Increased partitions during a lag peak | worsened the rebalance |
| retention↓ without estimating disk | a delete storm |
| Stopped 2 of 3 brokers | min ISR, unavailability |
| Alter RF without reassignment | the command won't work as expected |

## In production

- Git-tracked topic configs (Terraform/operator).
- Strimzi `KafkaTopic` CR — chapter [25](25-strimzi-k8s.md).
- Change management + a rollback plan.

## Summary

Kafka operations — **change a config**, **expand partitions deliberately**, **roll brokers one by one**, the heavy stuff — **reassignment**.

## Checklist

- [ ] You can alter/describe a topic config.
- [ ] You know the limitation of alter partitions.
- [ ] You described a rolling restart in 3 steps.

**Next:** [24. Lab: alter topic](24-lab-alter-topic.md).
