# 05. API Gateway HTTP API

## Why API Gateway

Calling Lambda directly from the browser is awkward (auth, CORS, throttling). **API Gateway** is a managed HTTP front door.

| API type | When |
|---|---|
| **HTTP API** | Cheaper, simpler, Lambda/JWT — default for new APIs |
| **REST API** | Legacy, more features (API keys, request validation v1) |
| **WebSocket** | Real-time |

This course uses **HTTP API** (v2).

## Architecture

```text
Client HTTPS
    → API Gateway (stage: $default or prod)
    → Integration (AWS_PROXY → Lambda)
    → Lambda handler
    → DynamoDB / S3
```

## Terraform

```hcl
resource "aws_apigatewayv2_api" "http" {
  name          = "course-images-api"
  protocol_type = "HTTP"
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["*"]
  }
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.api.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_image" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "GET /images/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
```

## Authorization (brief)

| Method | Scenario |
|---|---|
| JWT authorizer | Cognito / Auth0 |
| Lambda authorizer | Custom logic |
| IAM | Service-to-service |

For intermediate — open API in dev; in prod — JWT.

## Comparison with Ingress

| API Gateway | Kubernetes Ingress |
|---|---|
| Managed, pay per request | Controller + cloud LB |
| Built-in throttling | rate limit via annotations/mesh |
| Lambda integration | Service backend |

## Checklist

- HTTP API vs REST API — which to choose for Lambda?
- Why `aws_lambda_permission` for API GW?
- What is `route_key`?
- Why CORS on the API?

Next lesson: [06-lab-api-gateway.md](06-lab-api-gateway.md).
