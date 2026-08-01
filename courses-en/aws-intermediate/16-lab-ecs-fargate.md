# 16. Lab: containerized API on ECS

## Prep

Minimal Docker API image (Flask/FastAPI):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app.py .
CMD ["gunicorn", "-b", "0.0.0.0:8080", "app:app"]
```

`app.py` — `GET /health` → 200, `GET /images/{id}` → DynamoDB.

## Task 1. ECR repository

```hcl
resource "aws_ecr_repository" "api" {
  name = "${var.project}-api"
}
```

## Task 2. Push image

```bash
aws ecr get-login-password | docker login ...
docker build -t api .
docker tag api:latest $ECR_URL:latest
docker push $ECR_URL:latest
```

LocalStack: `aws --endpoint-url=... ecr create-repository` — simplified.

## Task 3. ECS cluster + task + service

Follow the outline from [15-ecs-fargate.md](15-ecs-fargate.md). Attach to the ALB from lab 04.

## Task 4. Verification

```bash
curl http://ALB_DNS/health
curl http://ALB_DNS/images/ID
```

## LocalStack track

If ECS is unavailable — **pass criteria:** describe the diff in README and attach a `terraform plan` of ECS resources; API stays on Lambda from lab 06.

## Success criteria

- [ ] Health 200 via ALB (real AWS) or plan succeeds (LocalStack)
- [ ] Task role reads DynamoDB
- [ ] Logs in CloudWatch log group

Next lesson: [17-remote-state.md](17-remote-state.md).
