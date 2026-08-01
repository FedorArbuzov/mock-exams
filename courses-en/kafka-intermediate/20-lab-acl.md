# 20. Lab: ACL — syntax and model (PLAINTEXT)

## Lab goal

Master **`kafka-acls.sh`**: create a principal, grant **ALLOW** on a topic/group, **list** and **remove** an ACL. On the **PLAINTEXT** stand the focus is on the **operator commands**; a real deny of an anonymous client requires a secured cluster (see the note).

## Prerequisites

- [19. Security](19-security-basics.md).
- The cluster is running.

> **PLAINTEXT limitation:** without `authorizer.class.name` and SASL/SSL, many ACLs are **documentation and CLI habit**, not hard enforcement. In your report state: "in prod we'll enable `StandardAuthorizer` + SCRAM".

---

## Task 1. List ACLs (baseline)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 --list 2>&1
```

**What you'll see:** an empty list or a warning about the authorizer — record the output.

---

## Task 2. Topic for the service

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.acl.orders \
  --partitions 3 --replication-factor 3
```

---

## Task 3. Add an ACL (concept for the service `User:orders-app`)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --add \
  --allow-principal User:orders-app \
  --operation Write --operation Describe \
  --topic lab.acl.orders

docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --add \
  --allow-principal User:orders-app \
  --operation Read \
  --group orders-app-consumer
```

---

## Task 4. List by topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --list --topic lab.acl.orders
```

**What you'll see:** `ALLOW` lines for `User:orders-app`.

---

## Task 5. Deny another principal (documentation)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --add \
  --deny-principal User:intruder \
  --operation Write \
  --topic lab.acl.orders
```

In a secured cluster, `intruder` under a SASL user **intruder** would get an **AuthorizationException** on produce.

On PLAINTEXT: a produce **without** a principal can still go through — **write this down** in your report.

---

## Task 6. Permission table for a microservice

| Service | Topic | Group | Operations |
|--------|-------|-------|--------------|
| orders-api | lab.acl.orders | — | Write, Describe |
| orders-worker | lab.acl.orders | orders-app-consumer | Read, Describe |

---

## Task 7. Remove the ACL (cleanup)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --remove \
  --allow-principal User:orders-app \
  --operation Write --operation Describe \
  --topic lab.acl.orders --force
```

---

## Success criteria

- [ ] You ran **add/list/remove** via `kafka-acls.sh`.
- [ ] You filled in the service permission table.
- [ ] You explicitly described the **PLAINTEXT limitation** vs prod SASL+authorizer.

**Next:** [21. Capacity](21-capacity.md).
