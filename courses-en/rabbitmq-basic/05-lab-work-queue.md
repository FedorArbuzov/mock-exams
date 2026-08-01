# 05. Lab: work queue and two competing consumers

## Lab goal

Build a **work queue**, publish **10 tasks**, pull them with **two** parallel `get`s (emulating two workers), and make sure each message is processed **once**.

## Prerequisites

- The environment from [lab 03](03-lab-first-queue.md) is up.
- Theory: [04. Work queues](04-work-queues.md).

```bash
cd deploy/rabbitmq
docker compose ps
```

---

## Task 1. Work queue topology

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.work.ex type=direct durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.work.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.work.ex destination=lab.work.q routing_key=task
```

**What you'll see:** `queue declared`, `binding declared`.

---

## Task 2. Publish 10 tasks

```bash
for i in $(seq 1 10); do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
    publish exchange=lab.work.ex routing_key=task payload="task-$i"
done

docker exec mock-rabbitmq rabbitmqctl list_queues name messages consumers | grep lab.work
```

**What you'll see:** `lab.work.q` — **10** messages, **0** consumers (no one has subscribed via a long-lived consumer yet).

---

## Task 3. Two "workers" in parallel

**Terminal A** (leave the loop running):

```bash
while docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.work.q ackmode=ack_requeue_false count=1 2>/dev/null | grep -q payload; do
  sleep 0.3
done
echo "worker A done"
```

**Terminal B** — the same loop with the label `worker B`.

Or **in a single script** (a sequential emulation of round-robin):

```bash
for round in $(seq 1 10); do
  worker=$(( round % 2 + 1 ))
  echo "--- round $round worker $worker ---"
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
    get queue=lab.work.q ackmode=ack_requeue_false count=1
done
```

**What you'll see:** 10 distinct payloads `task-1` … `task-10`; the queue is empty.

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.work
```

**0** messages.

---

## Task 4. Check "not processed twice"

Run a single `get` again:

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.work.q ackmode=ack_requeue_false count=1
```

**What you'll see:** an empty response / no payload — there are no duplicates.

---

## Task 5. UI: Publish burst

1. UI → **Queues** → `lab.work.q` → **Publish message** (5 times) routing through the exchange manually, or the publish loop again.
2. The **Consumers** tab after starting a long-lived consumer in code (in basic it's enough to know that the UI shows **active** subscribers).

---

## Task 6. Reset

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.work.q
```

---

## Success criteria

- [ ] 10 messages published, all retrieved
- [ ] After processing, `messages=0`
- [ ] No `task-N` received twice with `ack_requeue_false`
- [ ] You understand why there's **one** queue for all workers

## Takeaways for work

- Scaling workers = more consumers on the **same** queue
- `ack_requeue_false` = the task is removed from the queue
- Metrics: `messages_ready`, `consumers`

Next lesson: [06. Pub/Sub fanout](06-pubsub-fanout.md).
