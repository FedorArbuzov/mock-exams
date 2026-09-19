# 10. Lab: stop a broker

## Ticket

P1 — drill

SRE wants a game day: `kafka-03` process down, produce still works, URP goes to zero after start.

## Task 1. Produce while healthy

From a broker (console producer) or the host:

```text
kafka-console-producer --bootstrap-server 192.168.57.10:9092 \
  --topic shop.orders --producer-property acks=all
```

Send a few lines. Consume them from the beginning (or a new group).

## Task 2. Stop kafka-03

```bash
ansible kafka-03 -b -m service -a "name=<broker-unit> state=stopped"
```

Use the unit name from lesson 04.

```bash
kafka-topics --bootstrap-server 192.168.57.10:9092 --describe --topic shop.orders
kafka-topics --bootstrap-server 192.168.57.10:9092 --describe --under-replicated-partitions
```

ISR on some partitions should drop `kafka-03`’s broker id. Produce **again** with `acks=all` — should still succeed (`min.insync.replicas=2`).

## Task 3. Start and wait

```bash
ansible kafka-03 -b -m service -a "name=<broker-unit> state=started"
```

Wait until `--under-replicated-partitions` is empty. Do not “fix” by deleting the topic.

## Success criteria

- [ ] URP non-empty while `kafka-03` is down
- [ ] produce with `acks=all` succeeded during the outage
- [ ] URP empty after start
- [ ] you did not wipe `log.dirs`

`min.insync.replicas=3` plus one broker down is a different page — [16b](16b-lab-min-isr.md). Do not stop two hosts here (KRaft quorum).

Next: [11. Rolling restart](11-rolling.md).
