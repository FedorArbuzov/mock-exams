# 14. Lab: Schema Registry

## Lab goal

Bring up **Schema Registry** via the extras compose, register a **JSON Schema**, and verify a **compatible** and an **incompatible** evolution via REST.

## Prerequisites

- [13. Schema Registry](13-schema-registry.md).

## Stand

```bash
cd deploy/kafka
docker compose -f docker-compose.cluster.yml down
docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d
```

| Service | URL |
|--------|-----|
| Kafka (host) | `localhost:9094` |
| Schema Registry | [http://localhost:8081](http://localhost:8081) |

> The overlay [`docker-compose.extras.yml`](../../deploy/kafka/docker-compose.extras.yml) attaches the Registry and Connect to the **single-broker** `docker-compose.yml`. After the lab, restore the cluster for chapters 15–24.

---

## Task 1. Registry health

```bash
curl -s http://localhost:8081/
```

**What you'll see:** JSON with the Registry version.

---

## Task 2. Register JSON Schema v1

```bash
curl -s -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{
    "schema": "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"title\":\"Order\",\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"},\"amount\":{\"type\":\"number\"}},\"required\":[\"orderId\",\"amount\"]}"
  }' \
  http://localhost:8081/subjects/lab.orders-value/versions
```

**What you'll see:** `{"id":1,...}` (the id may differ).

---

## Task 3. Read latest

```bash
curl -s http://localhost:8081/subjects/lab.orders-value/versions/latest | jq .
```

---

## Task 4. Compatible change (BACKWARD)

Add an optional field `currency` with a default:

```bash
curl -s -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{
    "schema": "{\"$schema\":\"http://json-schema.org/draft-07/schema#\",\"title\":\"Order\",\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"},\"amount\":{\"type\":\"number\"},\"currency\":{\"type\":\"string\",\"default\":\"USD\"}},\"required\":[\"orderId\",\"amount\"]}"
  }' \
  http://localhost:8081/subjects/lab.orders-value/versions
```

**What you'll see:** version **2** is registered.

---

## Task 5. Incompatible change

Try to remove the required `amount`:

```bash
curl -s -X POST -H "Content-Type: application/vnd.schemaregistry.v1+json" \
  --data '{
    "schema": "{\"type\":\"object\",\"properties\":{\"orderId\":{\"type\":\"string\"}}}"
  }' \
  http://localhost:8081/subjects/lab.orders-value/versions
```

**What you'll see:** **409** / a compatibility error (if the mode is BACKWARD) — the Registry **rejected** the schema.

---

## Task 6. List subjects

```bash
curl -s http://localhost:8081/subjects
```

---

## Success criteria

- [ ] The Registry responds on :8081.
- [ ] **v1** and a compatible **v2** are registered.
- [ ] The incompatible schema is **rejected** (or you explained why it went through under NONE).
- [ ] You restored the cluster compose for the following chapters (per the README).

**Next:** [15. Kafka Connect](15-kafka-connect.md).
