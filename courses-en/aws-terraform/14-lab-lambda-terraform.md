# 14. Lab: Lambda function

## Task 1. handler.py

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

## Task 2. lambda.tf

Use `data "archive_file"` with `source_file = "${path.module}/lambda/handler.py"` and `handler = "handler.main"`.

Attach `aws_iam_role.lambda_exec` from lesson 10.

## Task 3. apply and invoke

```bash
tflocal apply
aws --endpoint-url=http://localhost:4566 lambda list-functions
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name YOUR_FUNCTION_NAME \
  --payload '{}' response.json
cat response.json
```

## Task 4. Logs

```bash
aws --endpoint-url=http://localhost:4566 logs describe-log-groups
```

**What you'll see:** the log group `/aws/lambda/...` after invoke.

## Success criteria

- [ ] The function is in the Active state
- [ ] Invoke returns 200
- [ ] The logs contain the printed event

Next lesson: [15-dynamodb-terraform.md](15-dynamodb-terraform.md).
