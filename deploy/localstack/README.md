# Minimal LocalStack (shared)

LocalStack-**only** compose for other AWS labs (for example [`python-aws`](../python-aws/README.md)).

**aws-terraform** uses the public one-liner (LocalStack **plus** Terraform/AWS CLI `lab`): [LOCALSTACK.md](https://github.com/FedorArbuzov/mockctl-setup/blob/main/LOCALSTACK.md) · [`deploy/aws-terraform`](../aws-terraform/README.md).

## Compose only (no lab toolbox)

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
curl -s http://localhost:4566/_localstack/health
```

Stop (volumes kept):

```bash
docker compose -f deploy/localstack/docker-compose.yml down
# wipe: add -v
```

**Port 4566** — only one LocalStack instance at a time.
