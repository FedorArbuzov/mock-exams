# 05. Lab: producer, keys, and kcat

## Lab goal

Send messages with **different keys**, confirm that records with the same key land in **one partition**. Repeat the send **from the host** via **kcat** (if installed).

## Prerequisites

- Stand is up: [`deploy/kafka`](../../deploy/kafka/README.md).
- Lab [03](03-lab-first-topic.md) completed.

Optional: [kcat](https://github.com/edenhill/kcat) (`brew install kcat` / `choco install kcat`).

---

## Task 1. Topic for keys

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.producer-keys \
  --partitions 6 --replication-factor 1 \
  --if-not-exists
```

---

## Task 2. Three orders, two events each

**Why:** see a stable partition for a key.

```bash
docker exec -i mock-kafka bash -c '
  /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.producer-keys \
    --property parse.key=true \
    --property key.separator=:
' <<EOF
ord-1:created
ord-1:paid
ord-2:created
ord-2:paid
ord-3:created
ord-3:paid
EOF
```

---

## Task 3. View partition by key

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.producer-keys \
  --from-beginning \
  --property print.key=true \
  --property print.partition=true \
  --property key.separator=: \
  --timeout-ms 8000
```

**What you’ll see:** for `ord-1` both lines with the **same** `Partition: N`; for `ord-2` and `ord-3` — their own numbers (may coincide by chance — unlikely with 6 partitions).

Write in a notebook:

```text
ord-1 -> partition ___
ord-2 -> partition ___
ord-3 -> partition ___
```

---

## Task 4. kcat from the host (optional)

**Why:** that’s how apps on a laptop connect too.

```bash
kcat -b localhost:9094 -L
echo 'ord-1:shipped' | kcat -b localhost:9094 -t lab.producer-keys -K:
kcat -b localhost:9094 -t lab.producer-keys -C -o beginning -f 'p=%p key=%k %s\n'
```

**What you’ll see:** `ord-1:shipped` in the **same** partition as `ord-1:created`.

**If no kcat:** skip; CLI in the container is enough.

---

## Task 5. Message without a key

```bash
echo 'no-key-event' | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.producer-keys
```

Consumer again — record without a key, partition by round-robin.

---

## Success criteria

- [ ] Topic `lab.producer-keys` with 6 partitions
- [ ] Events `ord-1:*` in one partition
- [ ] ord → partition table filled in
- [ ] (Opt.) kcat with `localhost:9094` sent and read a record

## Takeaways for work

- Format `key:value` in console producer: `parse.key=true` and separator.
- Bootstrap **9094** from the host, **9092** in `docker exec`.

Next lesson: [06. Consumer](06-consumer.md).
