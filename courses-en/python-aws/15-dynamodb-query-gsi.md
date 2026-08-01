# 15. DynamoDB: query, scan, condition expressions

## Intro: "scanning a 10 GB table every minute — a $800 bill"

A junior does a `scan` + filter in Python. DynamoDB charges for **every item read during the scan**. The right way: **Query** based on key design + **GSI** for alternate access patterns.

The environment uses a simple pk-only table; this chapter covers **patterns** for extending the schema.

## What you'll learn

- Query vs Scan — cost and when to use which.
- KeyConditionExpression, FilterExpression.
- GSI concept and projection.

---

## Access patterns first

Design the table **from queries**, not from an ER diagram:

| Pattern | Keys |
|---------|------|
| Get file by path | `pk = file:{key}` |
| Orders by user | `pk = USER#42`, `sk = ORDER#ts` |
| Orders by status (GSI) | GSI pk = STATUS#pending |

Single-table: [`pk`, `sk`] composite — industry standard.

---

## Query

```python
from boto3.dynamodb.conditions import Key

resp = table.query(
    KeyConditionExpression=Key("pk").eq("USER#42") & Key("sk").begins_with("ORDER#"),
)
items = resp["Items"]
```

| vs Scan | Query |
|---------|-------|
| Reads the entire table | Reads one partition |
| O(table size) | O(partition size) |
| Last resort | Default tool |

**KeyConditionExpression** — only on key attributes (pk, sk).

---

## Scan (avoid in prod)

```python
from boto3.dynamodb.conditions import Attr

resp = table.scan(FilterExpression=Attr("status").eq("pending"))
```

The filter is applied **after** the read — you pay for scanned items. Acceptable: small tables, one-off admin.

Use a **paginator** ([06-errors-retries-paginators](06-errors-retries-paginators.md)):

```python
for page in table.scan(FilterExpression=...):
    ...
```

---

## Condition expressions

| Type | Use |
|------|-----|
| `KeyConditionExpression` | Query keys only |
| `FilterExpression` | post-filter (still consumes RCU) |
| `ConditionExpression` | put/update/delete guards |

```python
table.put_item(
    Item={...},
    ConditionExpression="attribute_not_exists(pk)",
)
```

---

## GSI (Global Secondary Index)

```text
Main table:  pk=USER#id, sk=ORDER#ts
GSI status:  gsi_pk=STATUS#pending, gsi_sk=ORDER#ts
             → query all pending orders across users
```

```python
table.query(
    IndexName="status-index",
    KeyConditionExpression=Key("gsi_pk").eq("STATUS#pending"),
)
```

| GSI trait | Note |
|-----------|------|
| Separate capacity | on-demand shares |
| Eventually consistent | default for GSI |
| Projection | KEYS_ONLY / INCLUDE / ALL |

Create the GSI via Terraform, not at runtime.

---

## Expression attribute names

Reserved words (`name`, `status`):

```python
table.update_item(
    Key={"pk": "item:1"},
    UpdateExpression="SET #n = :val",
    ExpressionAttributeNames={"#n": "name"},
    ExpressionAttributeValues={":val": "New"},
)
```

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Scan + Python filter | huge bills |
| FilterExpression as a key substitute | slow + expensive |
| No GSI for a new access pattern | table rebuild |
| ConditionalCheckFailed not handled | 500 to user |

## Summary

**Query** by partition key — the primary tool. **Scan** — rare. **GSI** — alternate access paths. **ConditionExpression** — safe writes. Design keys from access patterns.

Next: [16-lab-dynamodb-query](16-lab-dynamodb-query.md).
