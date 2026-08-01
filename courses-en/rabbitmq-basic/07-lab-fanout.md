# 07. Lab: fanout — one event into two queues

## Lab goal

Create a **fanout exchange**, bind **two** queues, publish **one** message, and make sure **both** queues received a copy.

## Prerequisites

- The RabbitMQ environment is healthy.
- Theory: [06. Pub/Sub fanout](06-pubsub-fanout.md).

---

## Task 1. Exchange and queues

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.fanout.ex type=fanout durable=true

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.fanout.a.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.fanout.b.q durable=true
```

---

## Task 2. Bindings (without a routing key)

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.fanout.ex destination=lab.fanout.a.q
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.fanout.ex destination=lab.fanout.b.q

docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  list bindings source destination | grep lab.fanout
```

**What you'll see:** two lines with `lab.fanout.ex` → `a.q` and `b.q`.

---

## Task 3. A single publish

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.fanout.ex routing_key=ignored payload='{"event":"order.created","id":42}'

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.fanout
```

**What you'll see:** **1** message in `lab.fanout.a.q` and **1** in `lab.fanout.b.q`.

---

## Task 4. Read both queues

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.fanout.a.q ackmode=ack_requeue_false count=1
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  get queue=lab.fanout.b.q ackmode=ack_requeue_false count=1
```

**What you'll see:** the same payload `order.created` in both outputs.

---

## Task 5. Contrast with a work queue

Delete the bindings of queue B and repeat the publish — only A receives the message. Restore the binding for B.  
Briefly note it down: with **one** shared queue the second consumer **would split** the messages, not duplicate them.

---

## Task 6. UI

**Exchanges** → `lab.fanout.ex` → the bindings graph → both queues.  
**Publish** with an arbitrary routing key — both queue counters go +1.

---

## Task 7. Cleanup

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.fanout.a.q
docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=lab.fanout.b.q
```

---

## Success criteria

- [ ] Fanout exchange created
- [ ] Two queues with separate bindings
- [ ] One publish → 1 message in each queue
- [ ] The payload matches in A and B
- [ ] You can explain the difference from [lab 05](05-lab-work-queue.md)

## Takeaways for work

- Pub/sub = **N queues** on one fanout
- `routing_key` on fanout doesn't affect the route
- Queue names by service: `orders.events.email`

Next lesson: [08. Routing direct and topic](08-routing-direct-topic.md).
