# 14. Лаба: Lambda-функция

## Задание 1. handler.py

`lambda/handler.py`:

```python
import json
import os

def main(event, context):
    print("event:", json.dumps(event))
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "ok",
            "table": os.environ.get("DYNAMODB_TABLE", "unset"),
        }),
    }
```

## Задание 2. lambda.tf

Используйте `data "archive_file"` с `source_file = "${path.module}/lambda/handler.py"` и `handler = "handler.main"`.

Привяжите `aws_iam_role.lambda_exec` из урока 10.

## Задание 3. apply и invoke

```bash
tflocal apply
aws --endpoint-url=http://localhost:4566 lambda list-functions
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name YOUR_FUNCTION_NAME \
  --payload '{}' response.json
cat response.json
```

## Задание 4. Логи

```bash
aws --endpoint-url=http://localhost:4566 logs describe-log-groups
```

**Что увидите:** log group `/aws/lambda/...` после invoke.

## Критерии успеха

- [ ] Function в состоянии Active
- [ ] Invoke возвращает 200
- [ ] В логах есть print event

Следующий урок: [15-dynamodb-terraform.md](15-dynamodb-terraform.md).
