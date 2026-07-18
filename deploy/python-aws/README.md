# Python AWS (boto3) — стенд курса

**LocalStack** + Python lab container для курса [python-aws](../../courses/python-aws/README.md).

## Запуск

```bash
cd deploy/python-aws
docker compose up -d --build
docker compose ps
```

| Сервис | URL |
|--------|-----|
| LocalStack gateway | http://localhost:4566 |
| Health | `curl -s http://localhost:4566/_localstack/health` |

**Note:** если уже запущен [`deploy/localstack`](../localstack/docker-compose.yml) — остановите один из них (конфликт порта **4566**).

## Smoke

```bash
bash scripts/smoke.sh
powershell -File scripts/smoke.ps1
```

## Lab shell

```bash
docker exec -it mock-python-aws-lab bash
python lab_cli.py bootstrap
python -c "from shop_aws.s3_service import S3Service; print(S3Service().list_keys())"
pytest tests/ -v
```

## Env (с хоста)

```bash
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

## Сброс

```bash
docker compose down -v
```

## Связанные курсы

- [aws-basic](../../courses/aws-basic/README.md) — теория сервисов
- [aws-terraform](../../courses/aws-terraform/README.md) — IaC тот же pipeline
- [aws-intermediate](../../courses/aws-intermediate/README.md) — VPC, ALB, ECS
- [python-celery](../../courses/python-celery/README.md) — SQS vs Celery contrast
