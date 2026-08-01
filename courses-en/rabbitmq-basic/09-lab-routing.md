# 09. Lab: direct and topic routing

## Lab goal

Set up **direct** (SMS vs email) and **topic** (`orders.eu.*` vs `orders.#`), publish messages with different **routing keys**, and check which queues they ended up in.

## Prerequisites

- The environment is up, theory [08](08-routing-direct-topic.md).

---

## Part A. Direct

### A.1 Topology

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.route.direct type=direct durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.sms.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.email.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.direct destination=lab.route.sms.q routing_key=notify.sms
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.direct destination=lab.route.email.q routing_key=notify.email
```

### A.2 Publish and verify

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.direct routing_key=notify.sms payload='{"channel":"sms"}'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.direct routing_key=notify.email payload='{"channel":"email"}'

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.route
```

**What you'll see:** `sms.q` → 1, `email.q` → 1.

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.sms.q ackmode=ack_requeue_false count=1
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.email.q ackmode=ack_requeue_false count=1
```

---

## Part B. Topic

### B.1 Topology

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare exchange name=lab.route.topic type=topic durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.eu.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare queue name=lab.route.all.q durable=true
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.topic destination=lab.route.eu.q routing_key='orders.eu.*'
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  declare binding source=lab.route.topic destination=lab.route.all.q routing_key='orders.#'
```

### B.2 Three publishes

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.topic routing_key=orders.eu.created payload=eu-created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.topic routing_key=orders.us.created payload=us-created
docker exec mock-rabbitmq rabbitmqadmin -u course -p course \
  publish exchange=lab.route.topic routing_key=orders.eu.uk.created payload=eu-uk-created

docker exec mock-rabbitmq rabbitmqctl list_queues name messages | grep lab.route
```

**What you'll see (expectation):**

| rk | eu.q | all.q |
|----|------|-------|
| `orders.eu.created` | +1 | +1 |
| `orders.us.created` | 0 | +1 |
| `orders.eu.uk.created` | 0 | +1 |

The third message **doesn't** match `orders.eu.*` (three words after orders).

### B.3 Read and cross-check

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.eu.q ackmode=ack_requeue_false count=5
docker exec mock-rabbitmq rabbitmqadmin -u course -p course get queue=lab.route.all.q ackmode=ack_requeue_false count=5
```

---

## Task 3. A table in your notes

Fill it in for yourself:

```text
rk orders.eu.shipped → eu.q ?  all.q ?
rk orders.cancelled   → eu.q ?  all.q ?
```

Verify with publish + list_queues.

---

## Task 4. Cleanup

```bash
for q in lab.route.sms.q lab.route.email.q lab.route.eu.q lab.route.all.q; do
  docker exec mock-rabbitmq rabbitmqadmin -u course -p course purge queue name=$q
done
```

---

## Success criteria

- [ ] Direct: sms/email only into their own queues
- [ ] Topic: `orders.eu.created` in **both** eu and all
- [ ] Topic: `orders.eu.uk.created` only in all
- [ ] You explain why `*` doesn't match three words

## Takeaways for work

- Direct = exact rk; topic = a pattern in the binding
- Document the rk → queues matrix
- For the final project — topic `orders.#` and direct channels

Next lesson: [10. Ack and prefetch](10-ack-prefetch.md).
