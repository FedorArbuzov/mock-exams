# 15. DynamoDB: query, scan, condition expressions

## Введение: «scan table 10 GB каждую минуту — bill $800»

Junior делает `scan` + filter в Python. DynamoDB charge **read every item scanned**. Правильно: **Query** по key design + **GSI** для alternate access patterns.

Стенд использует simple pk-only table; эта глава — **patterns** для расширения schema.

## Что вы узнаете

- Query vs Scan — cost и когда что.
- KeyConditionExpression, FilterExpression.
- GSI concept и projection.

---

## Access patterns first

Design table **from queries**, not from ER diagram:

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
| Reads entire table | Reads one partition |
| O(table size) | O(partition size) |
| Last resort | Default tool |

**KeyConditionExpression** — only on key attributes (pk, sk).

---

## Scan (avoid in prod)

```python
from boto3.dynamodb.conditions import Attr

resp = table.scan(FilterExpression=Attr("status").eq("pending"))
```

Filter applied **after** read — you pay for scanned items. Acceptable: small tables, one-off admin.

Use **paginator** ([06-errors-retries-paginators](06-errors-retries-paginators.md)):

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

Create GSI via Terraform, not runtime.

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

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Scan + Python filter | huge bills |
| FilterExpression as key substitute | slow + expensive |
| No GSI for new access pattern | table rebuild |
| ConditionalCheckFailed not handled | 500 to user |

## Резюме

**Query** по partition key — primary tool. **Scan** — rare. **GSI** — alternate access paths. **ConditionExpression** — safe writes. Design keys from access patterns.

Далее: [16-lab-dynamodb-query](16-lab-dynamodb-query.md).
