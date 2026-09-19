# 16b. Lab: min.isr trap

## Ticket

P1 — writes dead, brokers still “up”

One broker is down. Produce with `acks=all` used to work (lesson 10). Tonight it hangs. Someone “hardened” the topic.

Do **not** stop two hosts. Each box is also a KRaft controller — two down is a **quorum** outage, not an ISR drill.

## Task 1. Break the contract

On a healthy cluster (`URP` empty, three units active):

```bash
kafka-configs --bootstrap-server 192.168.57.10:9092 \
  --entity-type topics --entity-name shop.orders \
  --alter --add-config min.insync.replicas=3
```

Stop **one** broker (`kafka-03`). Describe the topic: ISR has two ids. `min.insync.replicas` is 3.

```text
kafka-console-producer --bootstrap-server 192.168.57.10:9092 \
  --topic shop.orders --producer-property acks=all
```

Send a line. It must **not** commit (timeout / `NOT_ENOUGH_REPLICAS`). That is the page.

## Task 2. Close from git, not from CLI folklore

`playbooks/topics.yml` is source of truth (`min.insync.replicas=2`). Apply it. Start `kafka-03`. Wait until URP is empty. Produce again with `acks=all` — must succeed.

Do not delete the topic. Do not set `acks=1` “to unblock the shop.”

## Success criteria

- [ ] you saw produce fail with one broker down and `min.isr=3`
- [ ] `topics.yml` brought `min.insync.replicas` back to 2
- [ ] produce with `acks=all` works before you start the next lesson
- [ ] you did not stop two hosts

Next: [16c. Lab: preferred leaders](16c-lab-preferred-leader.md).
