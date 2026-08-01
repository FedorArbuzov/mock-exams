# 03. Lab: exchange, queue, binding, publish and get

## Lab goal

Bring up the RabbitMQ environment, declare a **direct exchange**, a **queue**, a **binding**, publish a message with a **routing key**, read it via `rabbitmqadmin get`, and check it in the **Management UI**.

## Prerequisites

- Docker, ports **5672** and **15672** free.
- From the repository root:

```bash
cd deploy/rabbitmq
docker compose up -d
docker compose ps
bash scripts/smoke.sh
```

Theory: [02. Architecture](02-architecture.md).  
Snippets (optional): [`examples/publish-consume.sh`](examples/publish-consume.sh).

---

## Task 1. Ping and built-in exchanges

**Why:** make sure the broker is healthy.

```bash
docker exec mock-rabbitmq rabbitmq-diagnostics -q ping
docker exec mock-rabbitmq rabbitmqadmin -u course -p course list exchanges name type | head -8
```

**What you'll see:** `Ping succeeded`; a list of `amq.direct`, `amq.fanout`, …

---

## Task 2. Declare an exchange and a queue

**Why:** an explicit topology instead of the "magic" of the default exchange.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.first.ex type=direct durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.first.q durable=true
```

Verification:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

**What you'll see:** `lab.first.q` with `0` messages.

---

## Task 3. Binding

**Why:** without a binding, publish won't reach the queue.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.first.ex destination=lab.first.q routing_key=lab.first.key

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  list bindings source destination routing_key | grep lab.first
```

**What you'll see:** a line `lab.first.ex` → `lab.first.q`, `lab.first.key`.

---

## Task 4. Publish

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.first.ex routing_key=lab.first.key \
  payload='{"event":"hello","n":1}'

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

**What you'll see:** `lab.first.q` — **1** message (ready).

**Wrong routing key** (a comprehension check):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.first.ex routing_key=wrong.key payload=orphan
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

A message with `wrong.key` **won't increase** the `lab.first.q` counter (unroutable; on the environment, without mandatory — silently dropped).

---

## Task 5. Get (manual consumer)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.first.q ackmode=ack_requeue_false count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.first
```

**What you'll see:** in the `get` output — the payload `hello`; in list_queues — **0** messages again.

---

## Task 6. Management UI

1. Open [http://localhost:15672](http://localhost:15672) — `course` / `course`.
2. **Exchanges** → `lab.first.ex` → the **Bindings** tab.
3. **Queues** → `lab.first.q` → **Publish message** (optional) and **Get messages**.

---

## Task 7. Reset (optional)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.first.q
```

Or delete the objects before the next lab:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course delete queue name=lab.first.q
docker exec mock-rabbitmq rabbitmqadmin -u course -p course delete exchange name=lab.first.ex
```

---

## Success criteria

- [ ] `rabbitmq-diagnostics ping` succeeds
- [ ] Exchange `lab.first.ex` type **direct**, queue **durable**
- [ ] Binding with `lab.first.key` created
- [ ] After publish there is **1** message in the queue; after get — **0**
- [ ] The exchange, queue and binding are visible in the UI

## Takeaways for work

- The chain: **declare exchange → queue → binding → publish → consume/ack**
- The **routing key** on publish must match the binding (direct)
- Diagnostics: `list_queues`, UI **Bindings**

Next lesson: [04. Work queues](04-work-queues.md).
