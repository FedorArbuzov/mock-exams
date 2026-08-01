# 06. Lab: REST API → Lambda

Extend the project from `aws-terraform` (image-pipeline) or create `intermediate-06`.

## Task 1. Lambda API handler

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

## Task 2. Terraform

Add the resources from [05-api-gateway.md](05-api-gateway.md):

- `aws_apigatewayv2_api`
- integration + route `GET /images/{id}`
- stage `$default`
- `aws_lambda_permission` for apigateway

## Task 3. Deploy and test

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

## Task 4. Presign upload (bonus)

Second route `POST /upload-url` → Lambda returns a presigned S3 PUT URL (see aws-basic S3).

## Success criteria

- [ ] GET returns JSON from DynamoDB or 404
- [ ] CORS headers on OPTIONS (if testing from a browser)
- [ ] apigw permission in state

Next lesson: [07-sqs-dlq.md](07-sqs-dlq.md).
