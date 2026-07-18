# Minimal LocalStack (shared)

Generic LocalStack for [aws-terraform](../courses/aws-terraform/README.md) and other AWS labs.

For the **python-aws** course prefer [`deploy/python-aws`](../python-aws/README.md) (LocalStack + lab container with `shop_aws`).

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
curl -s http://localhost:4566/_localstack/health
```

**Port 4566** — only one LocalStack instance at a time.
