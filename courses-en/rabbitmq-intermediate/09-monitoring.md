# 09. Monitoring RabbitMQ: Management API, Prometheus, runbook

## Intro: "the UI is green, but orders are piling up in the DLQ"

The Management UI shows **nodes running**, yet the business isn't getting notifications. The operator needs **numbers**: queue depth, publish/deliver rate, **unacked**, alarms on the **DLQ**, disk under the quorum journal. On the [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) environment, the **`rabbitmq_management`** and **`rabbitmq_prometheus`** plugins are enabled — metrics at **`localhost:15692/metrics`**.

Compare with [Kafka monitoring](../kafka-intermediate/17-monitoring.md): there it's lag per consumer group; here it's **messages_ready** and **messages_unacknowledged**.

## What you'll learn

- The **Management HTTP API** and UI.
- **rabbitmqctl** / **rabbitmq-diagnostics** for incidents.
- The **Prometheus** endpoint and key metrics.
- Alerts on the DLQ, memory/disk alarm.
- The "queue is growing" runbook.

---

## Management UI

| URL | Purpose |
|-----|------------|
| [http://localhost:15672](http://localhost:15672) | Overview, Queues, Connections |
| `/api/overview` | JSON for scripts |
| `/api/queues/{vhost}/{name}` | queue details |

Authentication on the environment: `course` / `course`.

Useful queue fields:

- `messages_ready` — waiting for a consumer
- `messages_unacknowledged` — taken but not ack'd
- `message_stats.publish_details.rate` — ingress

## Management API (curl)

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.dlq | jq '.messages,.messages_ready'
```

List of queues with DLQ in the name:

```bash
curl -s -u course:course 'http://localhost:15672/api/queues/%2F' | jq '.[].name'
```

## rabbitmqctl

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages consumers memory
docker exec mock-rabbitmq rabbitmqctl list_connections user peer_host state
docker exec mock-rabbitmq rabbitmq-diagnostics check_running
docker exec mock-rabbitmq rabbitmq-diagnostics status
```

On a **memory alarm**, the broker blocks publishers (`flow` in connections).

## Prometheus (:15692)

Environment config: [`deploy/rabbitmq/config/rabbitmq.conf`](../../deploy/rabbitmq/config/rabbitmq.conf) — `prometheus.tcp.port = 15692`.

```bash
curl -s http://localhost:15692/metrics | head -20
```

Example metrics (names may vary slightly by version):

| Metric | Meaning |
|---------|--------|
| `rabbitmq_queue_messages_ready` | backlog |
| `rabbitmq_queue_messages_unacked` | stuck at the consumer |
| `rabbitmq_queue_messages_published_total` | ingress counter |
| `rabbitmq_connections` | number of connections |
| `rabbitmq_process_resident_memory_bytes` | node RAM |

In Grafana ([observability-intermediate](../observability-intermediate/README.md)) — a dashboard + an alert `ready > N` on `orders.work`, `> 0` on `orders.dlq`.

## The DLQ and the SQS parallel

| Signal | RabbitMQ | SQS |
|--------|----------|-----|
| Poison backlog | `orders.dlq` ready > 0 | [ApproximateNumberOfMessagesVisible on the DLQ](../aws-intermediate/07-sqs-dlq.md) |
| Work backlog | `orders.work` ready growing | main queue depth |

## Runbook: "the queue is growing"

1. **Where** is it growing — work, DLQ, unacked?
2. **Consumers** — `consumers=0`? crashed? slow?
3. **Publish rate** vs **deliver rate** in the UI.
4. **Unacked** high — the consumer isn't ack'ing / slow processing / prefetch too large.
5. **DLQ** — investigate poison ([04-lab-dlx](04-lab-dlx.md)).
6. **Resources** — disk, memory alarm; quorum raft state.

## Comparison with the Kafka lag drill

[18-lab-lag-drill](../kafka-intermediate/18-lab-lag-drill.md) — stop the consumer, load the topic, watch the LAG. Here, in [10-lab-management-drill](10-lab-management-drill.md) — stop the consumer, publish to `orders.work`, watch `messages_ready`.

## Summary

The three legs of observability: the UI for a human, the API for automation, Prometheus for alerts. DLQ depth is a mandatory P2-level alert.

## Checklist

- The Prometheus port on the environment?
- The difference between ready and unacked?
- Which API request gives the DLQ depth?
- What to check on a memory alarm?

Next lesson: [10-lab-management-drill.md](10-lab-management-drill.md).
