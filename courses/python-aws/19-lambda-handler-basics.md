# 19. Lambda handler: event, context, return format

## Введение: «функция есть, но API Gateway отдаёт 502»

Handler возвращает plain string `"OK"` вместо dict с `statusCode` — API Gateway не понимает ответ. Или handler читает `event["name"]`, а при S3 trigger в event **нет** `name` — `KeyError`. Lambda — не Flask: контракт **event + context → return** зависит от **типа invoke**.

Эталон курса: [`shop_aws/lambda_handlers/handlers.py`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py).

## Что вы узнаете

- Сигнатура `def handler(event, context)`.
- Sync vs async handlers (Python runtime).
- Return formats: API Gateway proxy, direct invoke, S3/SQS triggers.
- `context` — что реально полезно в коде.

---

## Минимальный handler

```python
def hello(event, context):
    name = (event or {}).get("name", "world")
    return {"statusCode": 200, "body": json.dumps({"message": f"Hello, {name}!"})}
```

| Parameter | Тип | Содержание |
|-----------|-----|------------|
| `event` | dict / str / bytes | payload от invoker (API, S3, manual) |
| `context` | `LambdaContext` | runtime metadata, не business data |

**Rule:** never assume shape of `event` — validate per integration.

---

## Event shapes по источнику

| Invoke source | Event |
|---------------|-------|
| Manual / CLI `invoke` | ваш JSON: `{"name": "shop"}` |
| API Gateway HTTP API | nested: `requestContext`, `body` (string!) |
| S3 notification | `{"Records": [{ "s3": {...} }]}` |
| SQS trigger | `Records[]` с `body`, `receiptHandle` |
| EventBridge | `detail`, `source`, `detail-type` |

Direct invoke `hello` в стеке — simplest path для labs.

---

## Return format

### Direct invoke (lab default)

```python
return {"statusCode": 200, "processed": 3}
```

LocalStack/boto3 `invoke` → `Payload` JSON с вашим dict. **Не обязан** иметь `statusCode` — но convention полезна.

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

Return value **часто игнорируется** — success = no uncaught exception. Логируйте metrics в return для CloudWatch custom parsing (optional).

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
| `get_remaining_time_in_millis()` | abort long loop before hard kill |
| `aws_request_id` | correlation id в logs |
| `invoked_function_arn` | multi-env routing |
| `log_group_name` / `log_stream_name` | debugging |

Не храните `context` между invocations — каждый cold/warm start новый объект.

---

## Cold start vs warm

```text
First invoke: download zip → init runtime → import shop_aws → handler
Warm invoke: reuse execution environment → faster
```

| Factor | Impact |
|--------|--------|
| Package size | cold start latency |
| Top-level imports | run every cold start |
| VPC attach | + ENI setup seconds |

Pattern: lazy init clients **inside** handler или module-level с reuse (стек использует module-level services).

---

## Handler в стеке: process_s3_upload

```python
def process_s3_upload(event, context):
    table = DynamoDBRepository()
    s3 = S3Service()
    for record in event.get("Records", []):
        key = urllib.parse.unquote_plus(record["s3"]["object"]["key"])
        table.put_item(pk=f"file:{key}", data={...})
    return {"statusCode": 200, "processed": processed}
```

- Итерирует **все** Records (batch).
- Idempotent pk `file:{key}` ([18-lab-idempotent-ddb](18-lab-idempotent-ddb.md)).
- Return — summary для manual invoke tests.

---

## Error handling

| Behavior | Result |
|----------|--------|
| Unhandled exception | Lambda marks failed; S3/SQS retry |
| `return {"statusCode": 500, ...}` | API GW 500; async trigger may still **success** |
| Partial batch failure (SQS) | need `batchItemFailures` (partial response API) |

Для S3: fail whole invocation → event **повторится** (at-least-once).

---

## Python runtime notes

| Topic | Detail |
|-------|--------|
| Handler string | `shop_aws.lambda_handlers.handlers.hello` |
| Timeout | default 3s — increase for S3+DB |
| Memory | affects CPU proportionally |
| `async def` | supported in modern runtimes with event loop |

Labs: **sync** handlers + boto3 sync client ([02-session-client-resource](02-session-client-resource.md)).

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| `body` dict instead of JSON string | API GW 502 |
| Assume single Record | missed events in batch |
| Log entire event with PII | compliance leak |
| Global mutable state without care | cross-invocation bugs |

## Резюме

Lambda handler = **`(event, context) → return`**. Event shape **зависит от trigger**; return для API GW — `statusCode` + string `body`. В стеке: `hello` для invoke labs, `process_s3_upload` для S3 pipeline. Используйте `context.get_remaining_time_in_millis()` и idempotent writes.

Далее: [20-lab-hello-lambda](20-lab-hello-lambda.md).
