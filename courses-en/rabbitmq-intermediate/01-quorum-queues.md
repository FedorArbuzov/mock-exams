# 01. Quorum queues: reliability instead of classic mirrored

## Intro: "the mirrored queue died along with the node"

For years, RabbitMQ HA relied on **classic mirrored queues** (`ha-mode`, `ha-sync-mode` policies). After a leader failure, redistributing mirrors could take minutes; with split-brain and "dangling" unsynchronized mirrors, operators lost messages or got unpredictable ordering. Since RabbitMQ 3.8+, the development team has been promoting **quorum queues** — queues based on the **Raft** algorithm, built into the `rabbitmq_quorum_queue` plugin.

At the intermediate level you don't just set `x-queue-type=quorum`; you understand when quorum is mandatory, when a single node is enough for a lab, and how this relates to **partition replication in Kafka** and the **lack of ordering in SQS Standard**.

## What you'll learn

- The difference between **classic** / **quorum** / the deprecated **mirrored**.
- The **`x-queue-type=quorum`** and **`x-quorum-initial-group-size`** arguments.
- **Cluster** requirements (odd number of nodes, Erlang cookie).
- Quorum limitations (per-message TTL, priority, some policies).
- Comparison with [Kafka replication](../kafka-intermediate/01-replication.md).

---

## Why quorum

| Aspect | Classic mirrored | Quorum |
|--------|------------------|--------|
| Consensus | master + mirrors, manual policies | Raft, built-in leader |
| Consistency | depends on sync mode | stronger with majority |
| Status | legacy for new systems | recommended for new HA queues |
| Consumption | one consumer per queue (like classic) | same |

Quorum stores metadata and the journal on disk (**durable** is effectively mandatory). Losing a **majority** of the quorum's nodes makes the queue unavailable — like losing an ISR majority in Kafka.

## Declaring a queue

Via the Management API or AMQP `queue.declare`:

```json
{
  "durable": true,
  "arguments": {
    "x-queue-type": "quorum",
    "x-quorum-initial-group-size": 3
  }
}
```

Ready-made snippet: [`examples/quorum-queue-declare.json`](examples/quorum-queue-declare.json).

**`x-quorum-initial-group-size`** — how many members the Raft group has at creation time (usually = the number of cluster nodes, no more). On a **single node**, RabbitMQ 3.13 allows a quorum queue with group size 1 for learning; in production this is **not** HA.

CLI inside the container:

```bash
docker exec mock-rabbitmq rabbitmqctl add_vhost /lab 2>/dev/null || true
docker exec mock-rabbitmq rabbitmqctl set_permissions -p /lab course ".*" ".*" ".*"
```

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=orders.quorum durable=true arguments='{"x-queue-type":"quorum"}'
```

## Cluster environment

For real HA, bring up [`deploy/rabbitmq/docker-compose.cluster.yml`](../../deploy/rabbitmq/docker-compose.cluster.yml) and run [`scripts/init-cluster.sh`](../../deploy/rabbitmq/scripts/init-cluster.sh):

```text
rabbit@rabbitmq-1  ← cluster master node
rabbit@rabbitmq-2  ← join_cluster
rabbit@rabbitmq-3  ← join_cluster
```

Check:

```bash
docker exec mock-rabbitmq-1 rabbitmqctl cluster_status
```

A queue declared on any cluster node is replicated across the members of the Raft group.

## Limitations (important before you design)

- **Priority** messages (`x-max-priority`) — not for quorum (see chapter 05 — use classic for priority).
- **Per-message TTL** in the classic sense — limited; plan for **queue TTL** or DLX on classic.
- **Lazy mode** (classic) — not applicable.
- Queue size: watch **disk** and `memory` alarms — just like with Kafka brokers.

## Comparison with Kafka and SQS

| System | Unit of HA | "Poison" message |
|---------|------------|----------------------|
| RabbitMQ quorum | queue (Raft group) | DLX → DLQ (chapter 03) |
| Kafka | partition replicas (ISR) | separate topic / retry + DLQ pattern |
| SQS | managed replicas (opaque) | [DLQ after maxReceiveCount](../aws-intermediate/07-sqs-dlq.md) |

In Kafka, ordering is within a **partition**; in a RabbitMQ quorum queue it is **FIFO** for a single consumer (competing consumers share the work, and ordering between them is not guaranteed).

## Common mistakes

| Mistake | Symptom | Solution |
|--------|---------|---------|
| Quorum on standalone "like in prod" | no failover | 3-node cluster compose |
| `initial-group-size` > cluster nodes | declare fails | reduce it or add nodes |
| Expecting priority on quorum | declare error | classic queue or a different design |
| Confusing quorum with federated/shovel | messages in another DC | separate mechanisms |

## In production

- New critical queues — **quorum**, 3 or 5 nodes (odd number).
- Monitoring: `rabbitmq_queue_messages_ready`, Raft state — chapter 09.
- Migrating from mirrored: plan a **new queue + dual write / drain**, not a hot switch.

## Summary

Quorum queues are the HA standard in modern RabbitMQ. For this course: declare with `x-queue-type=quorum`, optionally add a cluster + `init-cluster.sh`, and understand the trade-offs against classic.

## Checklist

- Why quorum instead of mirrored?
- What does `x-quorum-initial-group-size` do?
- Can you run quorum on a single node in a lab?
- How does RabbitMQ HA queueing differ from partition RF in Kafka?

Next lesson: [02-lab-quorum.md](02-lab-quorum.md).
