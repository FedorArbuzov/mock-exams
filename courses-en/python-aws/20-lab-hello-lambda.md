# 20. Lab: invoke the hello handler locally

## Scenario

Before deploying to LocalStack Lambda you need to confirm: the handler **imports**, the event parses, the return serializes. The fastest path — a **local Python invoke** without AWS (unit-style), then — the Lambda API in LocalStack.

**Goal:** call `hello` with different events; compare a local import vs `lambda.invoke`.

---

## Prerequisites

```bash
cd deploy/python-aws
docker compose up -d --build
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Step 1. Direct Python call (no Lambda service)

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.lambda_handlers.handlers import hello

class FakeContext:
    aws_request_id = 'local-test-1'
    function_name = 'hello-local'
    memory_limit_in_mb = 128
    def get_remaining_time_in_millis(self):
        return 30000

event = {'name': 'shop'}
result = hello(event, FakeContext())
print(json.dumps(result, indent=2))
"
```

Expected:

```json
{
  "statusCode": 200,
  "body": "{\"message\": \"Hello, shop!\"}"
}
```

---

## Step 2. Default name

```bash
docker exec mock-python-aws-lab python -c "
import json
from shop_aws.lambda_handlers.handlers import hello

class C:
    aws_request_id = 'x'
    function_name = 'f'
    memory_limit_in_mb = 128
    def get_remaining_time_in_millis(self): return 99999

print(hello({}, C()))
"
```

→ `"Hello, world!"` — the default from `(event or {}).get("name", "world")`.

---

## Step 3. Mini test harness

Create `hello_lab.py` in the lab shell (don't commit it, or place it in `stack/` locally):

```python
#!/usr/bin/env python3
import json
from shop_aws.lambda_handlers.handlers import hello


class FakeContext:
    aws_request_id = "lab"
    function_name = "hello"
    memory_limit_in_mb = 128

    def get_remaining_time_in_millis(self) -> int:
        return 60_000


def main():
    cases = [
        {"name": "Alice"},
        {},
        {"name": ""},
    ]
    for event in cases:
        out = hello(event, FakeContext())
        body = json.loads(out["body"])
        print(f"event={event!r} -> {body['message']}")


if __name__ == "__main__":
    main()
```

```bash
docker exec mock-python-aws-lab python hello_lab.py
```

---

## Step 4. Parse an API-style body

If the event comes from API Gateway, `body` is a **string**:

```python
import json

api_event = {
    "body": json.dumps({"name": "API-user"}),
}
# in a real handler: data = json.loads(event.get("body") or "{}")
```

Exercise: adapt `hello` into a `hello_from_api(event, context)` wrapper without changing the core logic.

---

## Step 5. Smoke through the handlers module

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.lambda_handlers import handlers
assert hasattr(handlers, 'hello')
assert hasattr(handlers, 'process_s3_upload')
print('handlers OK')
"
```

Handler path for deploy ([21-lambda-deploy-packaging](21-lambda-deploy-packaging.md)):

```text
shop_aws.lambda_handlers.handlers.hello
```

---

## Step 6. Error injection

```python
def broken(event, context):
    raise RuntimeError("simulated failure")
```

Call it locally — confirm the exception does **not** turn into a 200. In a deployed Lambda this → a failed invocation + retry policy.

---

## Success criteria

- [ ] `hello({"name": "shop"})` → statusCode 200, correct message
- [ ] Empty event → `"world"`
- [ ] FakeContext with `get_remaining_time_in_millis`
- [ ] You know the handler string for packaging
- [ ] (Optional) `hello_from_api` wrapper

## Summary

A local invoke — the first test of Lambda logic without zip/deploy. FakeContext covers the minimum `context` API. The next step — zip + `create_function` in LocalStack.

Next: [21-lambda-deploy-packaging](21-lambda-deploy-packaging.md).
