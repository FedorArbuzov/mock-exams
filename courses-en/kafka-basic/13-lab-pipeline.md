# 13. Lab: mini pipeline (raw → enriched)

## Lab goal

Build **two topics**: raw orders and enriched ones. The “Enricher” role — consumer from `orders.raw` + producer to `orders.enriched` (manually via CLI, no code).

## Prerequisites

- Kafka stand.
- [12. Patterns](12-patterns.md), [11. Lab](11-lab-serialization.md).

---

## Task 1. Create topics

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.raw --partitions 3 --replication-factor 1 --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.enriched --partitions 3 --replication-factor 1 --if-not-exists
```

---

## Task 2. Raw event into orders.raw

```bash
printf '%s\n' 'ord-pipe-1|{"eventType":"order.created","orderId":"ord-pipe-1","customerTier":"SILVER"}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic orders.raw \
  --property parse.key=true --property key.separator='|'
```

---

## Task 3. “Enricher” — read and write enriched

Read (once):

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.raw \
  --group pipeline-enricher \
  --from-beginning \
  --property print.key=true \
  --timeout-ms 5000
```

Manually form the enriched event (added `discountPercent` by tier):

```bash
printf '%s\n' 'ord-pipe-1|{"eventType":"order.enriched","orderId":"ord-pipe-1","customerTier":"SILVER","discountPercent":5}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic orders.enriched \
  --property parse.key=true --property key.separator='|'
```

> In production the enricher is a long-lived service in a poll loop; here — a simulation of a pipeline step.

---

## Task 4. Downstream consumer

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.enriched \
  --group analytics \
  --from-beginning \
  --timeout-ms 5000
```

**What you’ll see:** JSON with `discountPercent":5`.

---

## Task 5. Kafka UI

In [http://localhost:8080](http://localhost:8080) — topics `orders.raw` and `orders.enriched`, messages, lag of group `pipeline-enricher` (should be 0).

---

## Success criteria

- [ ] Both topics created
- [ ] Message in `orders.raw` read by group `pipeline-enricher`
- [ ] Enriched message in `orders.enriched` read by group `analytics`
- [ ] Key `ord-pipe-1` preserved on both stages

## Takeaways for work

- Pipeline = several topics + idempotent consumers.
- Names: `domain.stage` (`orders.raw`, `orders.enriched`).

Next lesson: [14. Failures](14-failures.md).
