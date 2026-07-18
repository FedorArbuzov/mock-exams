# 16. Лаба: контейнерный API на ECS

## Подготовка

Минимальный Docker-образ API (Flask/FastAPI):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
```

`app.py` — `GET /health` → 200, `GET /images/{id}` → DynamoDB.

## Задание 1. ECR repository

```hcl
resource "aws_ecr_repository" "api" {
  name = "${var.project}-api"
}
```

## Задание 2. Push image

```bash
aws ecr get-login-password | docker login ...
docker build -t api .
docker tag api:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

LocalStack: `aws --endpoint-url=... ecr create-repository` — упрощённо.

## Задание 3. ECS cluster + task + service

По outline из [15-ecs-fargate.md](15-ecs-fargate.md). Привяжите к ALB из лабы 04.

## Задание 4. Проверка

```bash
curl http://ALB_DNS/health
curl http://ALB_DNS/images/ID
```

## Трек LocalStack

Если ECS недоступен — **зачёт:** описать в README diff и приложить `terraform plan` ECS ресурсов; API остаётся на Lambda из лабы 06.

## Критерии успеха

- [ ] Health 200 через ALB (real AWS) или plan успешен (LocalStack)
- [ ] Task role читает DynamoDB
- [ ] Logs в CloudWatch log group

Следующий урок: [17-remote-state.md](17-remote-state.md).
