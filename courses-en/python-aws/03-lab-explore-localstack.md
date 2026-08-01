# 03. Lab: explore the LocalStack environment

## Scenario

Day one — bring up **LocalStack + lab container**, confirm that S3, DynamoDB, and SQS are reachable through boto3, and locate the key `shop_aws` files. Without a working environment, all subsequent labs are pointless.

**Goal:** `docker compose up`, smoke green, bootstrap resources, a manual walkthrough.

---

## Step 1. Bring up the stack

```bash
cd deploy/python-aws
docker compose up -d --build
docker compose ps
```

Expected: `localstack` **healthy**, `lab` **running**.

**Port conflict:** if another LocalStack is already running on **4566** — stop it ([`deploy/localstack`](../../deploy/localstack/docker-compose.yml)).

---

## Step 2. LocalStack health

```bash
curl -s http://localhost:4566/_localstack/health | python -m json.tool
```

The `s3`, `dynamodb`, `sqs`, `sts` services should be `"available"`.

---

## Step 3. Smoke

```bash
bash scripts/smoke.sh
# or: powershell -File scripts/smoke.ps1
```

Expected: `bootstrap OK`, `s3 OK`, `smoke OK`.

---

## Step 4. Lab shell

```bash
docker exec -it mock-python-aws-lab bash
python lab_cli.py health
python lab_cli.py bootstrap
```

`health` → `{"status":"ok","framework":"python-aws-lab"}`.

---

## Step 5. Quick boto3 smoke

Inside the container:

```python
from shop_aws.s3_service import S3Service
from shop_aws.dynamodb_repo import DynamoDBRepository
from shop_aws.sqs_service import SQSService

S3Service().put_bytes("lab/hello.txt", b"explore")
print(S3Service().list_keys("lab/"))

DynamoDBRepository().put_item("lab:1", {"name": "probe"})
print(DynamoDBRepository().get_item("lab:1"))

print(SQSService().send({"event": "lab"}))
print(SQSService().receive_one())
```

---

## Step 6. File map

| File | Role |
|------|------|
| `shop_aws/config.py` | Settings from env |
| `shop_aws/clients.py` | Session + client/resource |
| `shop_aws/s3_service.py` | S3 CRUD |
| `shop_aws/dynamodb_repo.py` | DynamoDB table + items |
| `shop_aws/sqs_service.py` | Queue send/receive |
| `shop_aws/lambda_handlers/handlers.py` | S3 event handler |
| `scripts/bootstrap_localstack.py` | create bucket/table/queue |
| `lab_cli.py` | health + bootstrap CLI |

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Connection refused :4566 | `docker compose ps`, localstack logs |
| AccessDenied | keys = `test`/`test`? |
| Bucket not found | `python lab_cli.py bootstrap` |
| lab container exit | `docker compose logs lab` |

---

## Success criteria

- [ ] `docker compose ps` — localstack healthy
- [ ] `smoke.sh` exit 0
- [ ] bootstrap creates bucket, table, queue
- [ ] S3 put/get/list works
- [ ] You know where `clients.py` and `config.py` are

Next: [04-config-endpoints-localstack](04-config-endpoints-localstack.md).
