# 16. CLI: kafka-topics, consumer-groups, describe

## Intro: “everything is red in the UI — what do I do over SSH?”

On-call without Confluent Cloud UI access — only a bastion and **kafka-*.sh** (or wrappers like `kcat`). An operator must answer in minutes: does the topic exist? how many partitions? **who** is in the group? what’s the **lag**? This chapter is a command cheat sheet on the `mock-kafka` stand with paths `/opt/kafka/bin/`.

## What you'll learn

- **kafka-topics.sh**: list, create, describe, alter, delete.
- **kafka-console-producer/consumer.sh** — quick tests.
- **kafka-consumer-groups.sh**: list, describe, delete, reset offsets (carefully).
- **kafka-get-offsets.sh** / describe for log end.

## Bootstrap

| Context | Address |
|---------|---------|
| `docker exec mock-kafka …` | `localhost:9092` |
| host | `localhost:9094` |

Variable in the container shell:

```bash
export BS=localhost:9092
```

## kafka-topics.sh

```bash
# list
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --list

# create
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS \
  --create --topic demo.cli \
  --partitions 3 --replication-factor 1

# details (leader, ISR)
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --describe --topic demo.cli

# change partitions (increase only)
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --alter --topic demo.cli --partitions 6

# delete
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server $BS --delete --topic demo.cli
```

## kafka-consumer-groups.sh

```bash
# all groups
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --list

# lag and assignments
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --group lab-workers --describe

# group state
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --group lab-workers --describe --state

# delete group (offset metadata)
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS --group lab-workers --delete
```

### Reset offsets (carefully)

Only on the **training** stand:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server $BS \
  --group lab-workers \
  --reset-offsets --to-earliest \
  --topic orders.events --execute
```

First a **dry-run** without `--execute` shows the plan.

## kafka-get-offsets.sh

Log end offset by topic:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server $BS \
  --topic orders.events
```

Output like `orders.events:0:12345` — partition 0, end offset 12345.

## kafka-configs.sh

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server $BS \
  --entity-type topics --entity-name orders.events --describe
```

## Console producer/consumer (reminder)

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server $BS --topic demo.cli

docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS --topic demo.cli --from-beginning
```

## On the stand: diagnostic checklist

After an incident “consumer isn’t reading”:

```bash
export BS=localhost:9092

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --describe --topic <topic>
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server $BS --list
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server $BS --group <group> --describe
docker exec mock-kafka /opt/kafka/bin/kafka-get-offsets.sh --bootstrap-server $BS --topic <topic>
```

## Common mistakes

| Mistake | Consequence |
|---------|-------------|
| `--bootstrap-server` from host `9092` on laptop | connection refused — need **9094** |
| `--delete` topic on prod without backup | data loss |
| `--reset-offsets --execute` without agreement | mass reprocessing |
| Confusing **log end** and **committed** | wrong lag by hand |

## In production

- ACL: separate **read-only** accounts for describe/list.
- Automation: Terraform `kafka_topic`, GitOps.
- `kcat -L`, `kcat -Q` — quick checks from CI.
- Full runbook — in kafka-intermediate (ACL, quotas, rack awareness).

## Summary

**topics** — topology; **consumer-groups** — who reads and lag; **get-offsets** — log tail. All course labs use `/opt/kafka/bin/kafka-*.sh` inside `mock-kafka`.

## Checklist

- Command to describe a topic?
- How to see group lag?
- How does `--list` topics differ from `--list` groups?
- When do you need `--execute` on reset?

Next lesson: [17. Lab: CLI](17-lab-cli.md).
