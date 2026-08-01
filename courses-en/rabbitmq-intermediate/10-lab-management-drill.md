# 10. Lab: Management API, Prometheus, and the "queue is growing" drill

## Lab goal

Collect metrics via the **Management API** and **Prometheus :15692**, and run a drill: stop the consumer, load the queue, record the growth of **ready**, then "catch up" to zero.

## Prerequisites

```bash
cd deploy/rabbitmq
docker compose up -d
./courses/rabbitmq-intermediate/examples/dlx-setup.sh
```

---

## Task 1. Baseline API

```bash
curl -s -u course:course http://localhost:15672/api/overview | jq '.queue_totals'
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.work | jq '{name, messages_ready, messages_unacknowledged, consumers}'
```

**What you'll see:** JSON with zero or small counters.

---

## Task 2. Prometheus scrape

```bash
curl -s http://localhost:15692/metrics | grep -E '^rabbitmq_queue_messages_ready' | head -5
```

Find the metric with the label `queue="orders.work"` (if it exists after activity).

**What you'll see:** the text exposition format `# HELP` / `# TYPE`.

---

## Task 3. Backlog drill

Publish **20** messages without a consumer:

```bash
for i in $(seq 1 20); do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
    routing_key=orders.work payload="{\"n\":$i}"
done
```

Check:

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.work | jq '.messages_ready'
```

**What you'll see:** `messages_ready` ≈ 20, `consumers` = 0.

---

## Task 4. The "catching-up" consumer

Manually pull a batch:

```bash
for i in $(seq 1 20); do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course get \
    queue=orders.work ackmode=ack_requeue_false
done
```

The API again:

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.work | jq '.messages_ready'
```

**What you'll see:** 0.

Note down the drill **time** and the peak ready — as a mini-report for the final project.

---

## Task 5. DLQ alarm simulation

Put poison into work and send it to the DLQ (as in [04-lab-dlx](04-lab-dlx.md)), then:

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.dlq | jq '.messages_ready'
```

**Alert threshold (for the lab):** `messages_ready > 0` on `orders.dlq` → page ops.

Compare with CloudWatch on the SQS DLQ from [aws-intermediate/19-cloudwatch.md](../aws-intermediate/19-cloudwatch.md).

---

## Task 6. rabbitmqctl

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged consumers
docker exec mock-rabbitmq rabbitmq-diagnostics check_port_connectivity
```

**What you'll see:** the queue table agrees with the API.

---

## Success criteria

- [ ] Overview and the queue API respond
- [ ] Metrics are available on **:15692**
- [ ] Drill: ready 20 → 0 after consuming
- [ ] DLQ depth checked via the API

Next theory: [11-managed-cloud.md](11-managed-cloud.md).
