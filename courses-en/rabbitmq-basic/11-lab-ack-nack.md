# 11. Lab: ack, requeue and discarding

## Lab goal

Trace the behavior of **`ack_requeue_true`** vs **`ack_requeue_false`**, observe **redelivery** and the **reject without requeue** scenario on the `lab.ack.q` queue.

## Prerequisites

- Theory [10. Ack and prefetch](10-ack-prefetch.md).
- The `mock-rabbitmq` environment is running.

---

## Task 1. A queue via the default exchange

For simplicity — publish to the **default exchange** (routing key = queue name):

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.ack.q durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=amq.default routing_key=lab.ack.q payload=msg-1
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=amq.default routing_key=lab.ack.q payload=msg-2

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**What you'll see:** **2** messages ready.

---

## Task 2. ack_requeue_false (successful processing)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.ack.q ackmode=ack_requeue_false count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**What you'll see:** the payload `msg-1`; **1** left in the queue (msg-2).

---

## Task 3. ack_requeue_true (simulating a retry)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.ack.q ackmode=ack_requeue_true count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**What you'll see:** you read `msg-2`, but the counter is **1** again — the message **returned** to the tail.

Repeat `get` with `ack_requeue_false` to clear it.

---

## Task 4. reject_requeue_false (poison)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=amq.default routing_key=lab.ack.q payload=poison

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.ack.q ackmode=reject_requeue_false count=1

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.ack
```

**What you'll see:** `poison` **doesn't** remain in ready (discarded without requeue). In production such a message would go to a **DLX** (intermediate).

---

## Task 5. unacked (observation)

In an application, during long processing, messages hang as **unacked**. On the environment:

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages_ready messages_unacknowledged | grep lab.ack
```

Briefly describe: with `prefetch=1` and a stuck consumer, a second worker will keep going if it's subscribed to the same queue.

---

## Task 6. UI

**Queues** → `lab.ack.q` → **Get messages** with different Ack modes (if available in your UI version) or look at **Message rates**.

---

## Task 7. Cleanup

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.ack.q
```

---

## Success criteria

- [ ] `ack_requeue_false` reduces depth
- [ ] `ack_requeue_true` leaves the message in the queue
- [ ] `reject_requeue_false` removes without returning
- [ ] You can relate requeue=true to a **retry** and poison to a **DLX**

## Takeaways for work

- Ack **after** success in the DB
- Limit requeue with a retry counter
- Monitor `messages_unacknowledged`

Next lesson: [12. vs Kafka and SQS](12-vs-kafka-sqs.md).
