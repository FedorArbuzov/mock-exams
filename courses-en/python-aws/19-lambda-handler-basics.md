# 19. Lambda handler: event, context, return format

## Intro: "the function exists, but API Gateway returns 502"

The handler returns a plain string `"OK"` instead of a dict with `statusCode` — API Gateway doesn't understand the response. Or the handler reads `event["name"]`, but on an S3 trigger the event has **no** `name` — `KeyError`. Lambda is not Flask: the **event + context → return** contract depends on the **invoke type**.

Course reference: [`shop_aws/lambda_handlers/handlers.py`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py).

## What you'll learn

- The `def handler(event, context)` signature.
- Sync vs async handlers (Python runtime).
- Return formats: API Gateway proxy, direct invoke, S3/SQS triggers.
- `context` — what's actually useful in code.

---

## Minimal handler

```python
def hello(event, context):
    name = (event or {}).get("name", "world")
    return {"statusCode": 200, "body": json.dumps({"message": f"Hello, {name}!"})}
```

| Parameter | Type | Contents |
|-----------|-----|------------|
| `event` | dict / str / bytes | payload from the invoker (API, S3, manual) |
| `context` | `LambdaContext` | runtime metadata, not business data |

**Rule:** never assume the shape of `event` — validate per integration.

---

## Event shapes by source

| Invoke source | Event |
|---------------|-------|
| Manual / CLI `invoke` | your JSON: `{"name": "shop"}` |
| API Gateway HTTP API | nested: `requestContext`, `body` (string!) |
| S3 notification | `{"Records": [{ "s3": {...} }]}` |
| SQS trigger | `Records[]` with `body`, `receiptHandle` |
| EventBridge | `detail`, `source`, `detail-type` |

Direct invoke `hello` in the stack — the simplest path for labs.

---

## Return format

### Direct invoke (lab default)

```python
return {"statusCode": 200, "processed": 3}
```

LocalStack/boto3 `invoke` → `Payload` JSON with your dict. It's **not required** to have `statusCode` — but the convention is useful.

### API Gateway Lambda proxy integration

```python
return {
    "statusCode": 200,
    "headers": {"Content-Type": "application/json"},
    "body": json.dumps({"ok": True}),
}
```

| Field | Required for API GW |
|-------|---------------------|
| `statusCode` | yes |
| `body` | string (JSON encoded) |
| `headers` | optional |
| `isBase64Encoded` | for binary |

### S3 / async triggers

The return value is **often ignored** — success = no uncaught exception. Log metrics in the return for CloudWatch custom parsing (optional).

---

## Context object

```python
def handler(event, context):
    remaining_ms = context.get_remaining_time_in_millis()
    request_id = context.aws_request_id
    function_name = context.function_name
    memory_limit = context.memory_limit_in_mb
```

| Attribute | Use |
|-----------|-----|
| `get_remaining_time_in_millis()` | abort a long loop before the hard kill |
| `aws_request_id` | correlation id in logs |
| `invoked_function_arn` | multi-env routing |
| `log_group_name` / `log_stream_name` | debugging |

Don't store `context` between invocations — each cold/warm start is a new object.

---

## Cold start vs warm

```text
First invoke: download zip → init runtime → import shop_aws → handler
Warm invoke: reuse execution environment → faster
```

| Factor | Impact |
|--------|--------|
| Package size | cold start latency |
| Top-level imports | run on every cold start |
| VPC attach | + ENI setup seconds |

Pattern: lazy init clients **inside** the handler or module-level with reuse (the stack uses module-level services).

---

## Handler in the stack: process_s3_upload

```python
def process_s3_upload(event, context):
    table = DynamoDBRepository()
    s3 = S3Service()
    for record in event.get("Records", []):
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        table.put_item(pk=f"file:{key}", data={...})
    return {"statusCode": 200, "processed": processed}
```

- Iterates over **all** Records (batch).
- Idempotent pk `file:{key}` ([18-lab-idempotent-ddb](18-lab-idempotent-ddb.md)).
- Return — a summary for manual invoke tests.

---

## Error handling

| Behavior | Result |
|----------|--------|
| Unhandled exception | Lambda marks it failed; S3/SQS retry |
| `return {"statusCode": 500, ...}` | API GW 500; an async trigger may still **succeed** |
| Partial batch failure (SQS) | need `batchItemFailures` (partial response API) |

For S3: failing the whole invocation → the event is **retried** (at-least-once).

---

## Python runtime notes

| Topic | Detail |
|-------|--------|
| Handler string | `shop_aws.lambda_handlers.handlers.hello` |
| Timeout | default 3s — increase for S3+DB |
| Memory | affects CPU proportionally |
| `async def` | supported in modern runtimes with an event loop |

Labs: **sync** handlers + sync boto3 client ([02-session-client-resource](02-session-client-resource.md)).

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| `body` dict instead of a JSON string | API GW 502 |
| Assuming a single Record | missed events in a batch |
| Logging the entire event with PII | compliance leak |
| Global mutable state without care | cross-invocation bugs |

## Summary

Lambda handler = **`(event, context) → return`**. The event shape **depends on the trigger**; the return for API GW — `statusCode` + string `body`. In the stack: `hello` for invoke labs, `process_s3_upload` for the S3 pipeline. Use `context.get_remaining_time_in_millis()` and idempotent writes.

Next: [20-lab-hello-lambda](20-lab-hello-lambda.md).
