# 06. Лаба: REST API → Lambda

Расширьте проект из `aws-terraform` (image-pipeline) или создайте `intermediate-06`.

## Задание 1. Lambda API handler

`lambda/api_handler.py`:

```python
import json
import os
import boto3

table = boto3.resource("dynamodb").Table(os.environ["DYNAMODB_TABLE"])

def main(event, context):
    image_id = event.get("pathParameters", {}).get("id")
    if not image_id:
        return _resp(400, {"error": "missing id"})
    item = table.get_item(Key={"image_id": image_id}).get("Item")
    if not item:
        return _resp(404, {"error": "not found"})
    return _resp(200, item)

def _resp(code, body):
    return {
        "statusCode": code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body, default=str),
    }
```

## Задание 2. Terraform

Добавьте ресурсы из [05-api-gateway.md](05-api-gateway.md):

- `aws_apigatewayv2_api`
- integration + route `GET /images/{id}`
- stage `$default`
- `aws_lambda_permission` для apigateway

## Задание 3. Deploy и тест

```bash
tflocal apply
curl "$(tflocal output -raw api_endpoint)/images/TEST_ID"
```

Output `api_endpoint`:

```hcl
output "api_endpoint" {
  value = aws_apigatewayv2_api.http.api_endpoint
}
```

## Задание 4. Presign upload (бонус)

Второй route `POST /upload-url` → Lambda возвращает presigned S3 PUT URL (см. aws-basic S3).

## Критерии успеха

- [ ] GET возвращает JSON из DynamoDB или 404
- [ ] CORS headers при OPTIONS (если тест из браузера)
- [ ] Permission apigw в state

Следующий урок: [07-sqs-dlq.md](07-sqs-dlq.md).
