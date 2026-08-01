# 14. Lab: ACL — allow, explicit deny (tabletop + optional broker)

## Lab goal

Design an **ACL matrix** for three services, perform a **deny-by-default** exercise, and (if the broker supports an authorizer in your image) apply ACLs via the CLI.

## Prerequisites

- [13-security-advanced](13-security-advanced.md).
- KRaft sandbox: `deploy/kafka`, `docker compose up -d`.

**Note:** the default training image may be **without** `authorizer.class.name`. Some tasks are **tabletop**; optionally — enabling the `StandardAuthorizer` per the docs for your Kafka version (locally only).

---

## Characters

| Service | Principal | Needs |
|--------|-----------|-------|
| order-api | `User:order-api` | Write `orders.events`, Read `orders.dlq` |
| billing | `User:billing` | Read `orders.events`, Write `billing.invoices` |
| admin-tool | `User:admin` | Describe *, Create topic (break-glass) |

---

## Task 1. ACL matrix (tabletop)

Fill in the Allow/Deny table:

| Principal | Topic | Operation | Allow/Deny |
|-----------|-------|-----------|------------|
| order-api | orders.events | Write | Allow |
| order-api | billing.invoices | Write | **Deny** |
| billing | orders.events | Read | Allow |
| billing | orders.events | Write | **Deny** |
| billing | billing.invoices | Write | Allow |
| * | * | * | Deny (default) |

---

## Task 2. Commands (reference)

When SASL/SSL and the authorizer are enabled:

```bash
# Allow order-api write
kafka-acls.sh --bootstrap-server $BS \
  --add --allow-principal User:order-api \
  --operation Write --topic orders.events

# Deny order-api write to billing
kafka-acls.sh --bootstrap-server $BS \
  --add --deny-principal User:order-api \
  --operation Write --topic billing.invoices

# Allow billing read orders
kafka-acls.sh --bootstrap-server $BS \
  --add --allow-principal User:billing \
  --operation Read --topic orders.events --group billing-consumer

# List ACLs
kafka-acls.sh --bootstrap-server $BS --list
```

**In the interview:** deny is written **explicitly**; the evaluation order — deny wins.

---

## Task 3. Denial simulation (without an ACL broker)

Describe the expected **error code** on a violation:

| Action | Expectation |
|----------|----------|
| billing writes to `orders.events` | `TOPIC_AUTHORIZATION_FAILED` |
| order-api reads `billing.invoices` | `GROUP_AUTHORIZATION_FAILED` / topic auth |

---

## Task 4. Super user policy

Write 3 rules for `super.users`:

1. No more than N people.
2. MFA on break-glass.
3. Every use — a ticket + audit review.

---

## Task 5. MSK IAM mapping (bonus)

| Kafka ACL | MSK IAM policy concept |
|-----------|------------------------|
| Write topic X | `kafka:WriteData` on the topic ARN |
| Read group G | `kafka:ReadData` + group ARN |

Cross-check with [11-managed-kafka](11-managed-kafka.md).

---

## Success criteria

- [ ] Allow/Deny matrix for 3 services.
- [ ] Explained deny vs default deny cluster.
- [ ] Named the authorization error code.
- [ ] (Optional) Ran `kafka-acls.sh --list`.

**Next:** [15-troubleshooting](15-troubleshooting.md).
