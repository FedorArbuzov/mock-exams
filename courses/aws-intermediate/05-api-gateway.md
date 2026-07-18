# 05. API Gateway HTTP API

## Зачем API Gateway

Прямой вызов Lambda из браузера неудобен (auth, CORS, throttling). **API Gateway** — управляемый HTTP-фронт.

| Тип API | Когда |
|---|---|
| **HTTP API** | Дешевле, проще, Lambda/JWT — default для новых API |
| **REST API** | Legacy, больше фич (API keys, request validation v1) |
| **WebSocket** | Real-time |

Курс использует **HTTP API** (v2).

## Архитектура

```text
Client HTTPS
    → API Gateway (stage: $default или prod)
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

## Авторизация (кратко)

| Метод | Сценарий |
|---|---|
| JWT authorizer | Cognito / Auth0 |
| Lambda authorizer | Кастомная логика |
| IAM | Service-to-service |

Для intermediate — открытый API в dev; в prod — JWT.

## Сравнение с Ingress

| API Gateway | Kubernetes Ingress |
|---|---|
| Managed, pay per request | Controller + cloud LB |
| Встроенный throttling | rate limit через annotations/mesh |
| Lambda integration | Service backend |

## Чек-лист

- HTTP API vs REST API — что выбрать для Lambda?
- Зачем `aws_lambda_permission` для API GW?
- Что такое `route_key`?
- Зачем CORS на API?

Следующий урок: [06-lab-api-gateway.md](06-lab-api-gateway.md).
