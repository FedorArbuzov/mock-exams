# 02. Lab: quorum queue and cluster

## Lab goal

On the [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) environment you'll declare a **quorum queue** with `x-queue-type=quorum`, publish and read messages, then (optionally) repeat it on a **three-node cluster** after `init-cluster.sh`.

## Prerequisites

- Docker is running.
- Ports `5672` and `15672` are free.

```bash
cd deploy/rabbitmq
docker compose down
docker compose up -d
docker compose ps
```

Wait for **healthy** (`rabbitmq-diagnostics ping`).

---

## Task 1. Quorum on a single node

**Why:** confirm that declaring with `x-queue-type` works without a cluster.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=lab.quorum.single durable=true \
  arguments='{"x-queue-type":"quorum"}'
```

Publish and consume:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course publish \
  routing_key=lab.quorum.single payload='{"orderId":"Q-1"}'

docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.quorum.single ackmode=ack_requeue_false
```

**What you'll see:** queue type `quorum` in the UI (Queues → `lab.quorum.single`), one message retrieved.

Check via ctl:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name type messages --formatter table
```

---

## Task 2. JSON from the course example

**Why:** connect the lab to [`examples/quorum-queue-declare.json`](examples/quorum-queue-declare.json).

```bash
cd courses/rabbitmq-intermediate
curl -sf -u course:course -H "content-type: application/json" \
  -X PUT "http://localhost:15672/api/queues/%2F/lab.quorum.api" \
  -d @- <<'EOF'
{
  "durable": true,
  "auto_delete": false,
  "arguments": {
    "x-queue-type": "quorum"
  }
}
EOF
```

**What you'll see:** HTTP 201/204; the queue in the UI with type quorum.

---

## Task 3 (optional). Three-node cluster

**Why:** see Raft group size 3 "for real".

```bash
cd deploy/rabbitmq
docker compose down
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

Declare on the **first** node:

```bash
docker exec mock-rabbitmq-1 rabbitmqadmin -u course -p course declare queue \
  name=lab.quorum.cluster durable=true \
  arguments='{"x-queue-type":"quorum","x-quorum-initial-group-size":3}'
```

Cluster status:

```bash
docker exec mock-rabbitmq-1 rabbitmqctl cluster_status
```

Publish through the **second** node (port 5673 from the host):

```bash
docker exec mock-rabbitmq-2 rabbitmqadmin -u course -p course -H localhost:15672 declare binding \
  source=amq.default destination=lab.quorum.cluster routing_key=lab.quorum.cluster 2>/dev/null || true

docker exec mock-rabbitmq-2 rabbitmqadmin -u course -p course publish \
  routing_key=lab.quorum.cluster payload='from-node-2'
```

**What you'll see:** `Running Nodes` — three nodes; the message is visible on `mock-rabbitmq-1` in `list_queues`.

Return to single node for the following chapters:

```bash
docker compose -f docker-compose.cluster.yml down
docker compose up -d
```

---

## Success criteria

- [ ] Queue `lab.quorum.single` of type **quorum**, message published and received
- [ ] Queue created via the Management API with `x-queue-type`
- [ ] (Opt.) 3-node cluster, `init-cluster.sh` runs without errors, quorum on the cluster

Next theory: [03-dead-letter-exchange.md](03-dead-letter-exchange.md).
