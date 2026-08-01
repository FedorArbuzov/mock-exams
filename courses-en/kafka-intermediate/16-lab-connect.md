# 16. Lab: Kafka Connect FileStream

## Lab goal

Bring up Connect, create a **FileStreamSource** and a **FileStreamSink** from the example configs, and run lines through **file → topic → file**.

## Prerequisites

- [15. Kafka Connect](15-kafka-connect.md).
- Stand: `docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d`

---

## Task 1. Check the Connect REST

```bash
curl -s http://localhost:8083/
curl -s http://localhost:8083/connector-plugins | head -c 500
```

**What you'll see:** the Connect version; in plugins — `FileStreamSource` / `FileStreamSink`.

---

## Task 2. Prepare a file in the container

```bash
docker exec mock-kafka-connect mkdir -p /tmp/connect-source /tmp/connect-sink
docker exec mock-kafka-connect bash -c 'echo line-one > /tmp/connect-source/orders.txt'
docker exec mock-kafka-connect bash -c 'echo line-two >> /tmp/connect-source/orders.txt'
```

---

## Task 3. Create the source connector

From the repository root (the path to the JSON):

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d @courses/kafka-intermediate/examples/connect/file-source.json \
  http://localhost:8083/connectors
```

Check:

```bash
curl -s http://localhost:8083/connectors/file-source-orders/status | jq .
```

**What you'll see:** `"state":"RUNNING"`.

---

## Task 4. Read the topic

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic connect.orders.raw \
  --from-beginning --timeout-ms 5000
```

**What you'll see:** `line-one`, `line-two` (and a null key).

---

## Task 5. Sink connector

```bash
curl -s -X POST -H "Content-Type: application/json" \
  -d @courses/kafka-intermediate/examples/connect/file-sink.json \
  http://localhost:8083/connectors
```

Wait 5 s, read the sink file:

```bash
docker exec mock-kafka-connect cat /tmp/connect-sink/out.txt
```

**What you'll see:** the same lines in `out.txt`.

---

## Task 6. Add a line — the source picks it up

```bash
docker exec mock-kafka-connect bash -c 'echo line-three >> /tmp/connect-source/orders.txt'
sleep 3
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic connect.orders.raw \
  --offset 2 --partition 0 --timeout-ms 3000
```

---

## Task 7. Delete the connectors (cleanup)

```bash
curl -s -X DELETE http://localhost:8083/connectors/file-sink-orders
curl -s -X DELETE http://localhost:8083/connectors/file-source-orders
```

---

## Success criteria

- [ ] Source **RUNNING**, messages in `connect.orders.raw`.
- [ ] Sink wrote to `/tmp/connect-sink/out.txt`.
- [ ] You understand the **file → topic → file** path.
- [ ] You used the examples from [`examples/connect/`](examples/connect/).

**Next:** restore the **cluster** for [17. Monitoring](17-monitoring.md).

```bash
docker compose -f docker-compose.yml -f docker-compose.extras.yml down
docker compose -f docker-compose.cluster.yml up -d
```
