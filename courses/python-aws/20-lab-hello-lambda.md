# 20. Лаба: invoke hello handler локально

## Сценарий

Перед деплоем в LocalStack Lambda нужно убедиться: handler **импортируется**, event парсится, return сериализуется. Самый быстрый путь — **локальный Python invoke** без AWS (unit-style), затем — Lambda API в LocalStack.

**Цель:** вызвать `hello` с разными event; сравнить local import vs `lambda.invoke`.

---

## Предусловия

```bash
cd deploy/python-aws
docker compose up -d --build
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Шаг 1. Direct Python call (no Lambda service)

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

Ожидаемо:

```json
{
  "statusCode": 200,
  "body": "{\"message\": \"Hello, shop!\"}"
}
```

---

## Шаг 2. Default name

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

→ `"Hello, world!"` — default из `(event or {}).get("name", "world")`.

---

## Шаг 3. Mini test harness

Создайте `hello_lab.py` в lab shell (не коммитьте или положите в `stack/` локально):

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

## Шаг 4. Parse API-style body

Если event приходит от API Gateway, `body` — **string**:

```python
import json

api_event = {
    "body": json.dumps({"name": "API-user"}),
}
# в реальном handler: data = json.loads(event.get("body") or "{}")
```

Упражнение: адаптируйте `hello` wrapper `hello_from_api(event, context)` без изменения core logic.

---

## Шаг 5. Smoke через handlers module

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.lambda_handlers import handlers
assert hasattr(handlers, 'hello')
assert hasattr(handlers, 'process_s3_upload')
print('handlers OK')
"
```

Handler path для deploy ([21-lambda-deploy-packaging](21-lambda-deploy-packaging.md)):

```text
shop_aws.lambda_handlers.handlers.hello
```

---

## Шаг 6. Error injection

```python
def broken(event, context):
    raise RuntimeError("simulated failure")
```

Вызовите локально — убедитесь, что exception **не** превращается в 200. В deployed Lambda это → failed invocation + retry policy.

---

## Критерии приёмки

- [ ] `hello({"name": "shop"})` → statusCode 200, correct message
- [ ] Empty event → `"world"`
- [ ] FakeContext с `get_remaining_time_in_millis`
- [ ] Знаете handler string для packaging
- [ ] (Optional) `hello_from_api` wrapper

## Резюме

Локальный invoke — первый тест Lambda logic без zip/deploy. FakeContext покрывает минимум `context` API. Следующий шаг — zip + `create_function` в LocalStack.

Далее: [21-lambda-deploy-packaging](21-lambda-deploy-packaging.md).
