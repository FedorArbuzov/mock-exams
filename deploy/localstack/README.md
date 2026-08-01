# Minimal LocalStack (shared)

Generic LocalStack for [`aws-terraform`](../../courses-en/aws-terraform/README.md) and other AWS labs.

**Preferred start** (from the mock-exams repository root — **no Kubernetes**):

```bash
mockctl localstack up
mockctl localstack status
curl -s http://localhost:4566/_localstack/health | head
```

Stop (volumes kept):

```bash
mockctl localstack down
```

## Fallback without mockctl

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
curl -s http://localhost:4566/_localstack/health
```

**Port 4566** — only one LocalStack instance at a time.

For the **python-aws** course prefer [`deploy/python-aws`](../python-aws/README.md) (LocalStack + lab container with `shop_aws`).
