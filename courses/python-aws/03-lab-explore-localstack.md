# 03. Лаба: explore LocalStack стенд

## Сценарий

Первый день — поднять **LocalStack + lab container**, убедиться что S3, DynamoDB, SQS доступны через boto3, и найти ключевые файлы `shop_aws`. Без рабочего стенда все последующие labs бессмысленны.

**Цель:** `docker compose up`, smoke green, bootstrap resources, ручной walkthrough.

---

## Шаг 1. Поднять stack

```bash
cd deploy/python-aws
docker compose up -d --build
docker compose ps
```

Ожидаем: `localstack` **healthy**, `lab` **running**.

**Конфликт порта:** если уже запущен другой LocalStack на **4566** — остановите его ([`deploy/localstack`](../../deploy/localstack/docker-compose.yml)).

---

## Шаг 2. Health LocalStack

```bash
curl -s http://localhost:4566/_localstack/health | python -m json.tool
```

Сервисы `s3`, `dynamodb`, `sqs`, `sts` — `"available"`.

---

## Шаг 3. Smoke

```bash
bash scripts/smoke.sh
# или: powershell -File scripts/smoke.ps1
```

Ожидаем: `bootstrap OK`, `s3 OK`, `smoke OK`.

---

## Шаг 4. Lab shell

```bash
docker exec -it mock-python-aws-lab bash
python lab_cli.py health
python lab_cli.py bootstrap
```

`health` → `{"status":"ok","framework":"python-aws-lab"}`.

---

## Шаг 5. Быстрый boto3 smoke

Внутри контейнера:

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

## Шаг 6. Карта файлов

| File | Role |
|------|------|
| `shop_aws/config.py` | Settings из env |
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

## Критерии приёмки

- [ ] `docker compose ps` — localstack healthy
- [ ] `smoke.sh` exit 0
- [ ] bootstrap создаёт bucket, table, queue
- [ ] S3 put/get/list работает
- [ ] Знаете где `clients.py` и `config.py`

Далее: [04-config-endpoints-localstack](04-config-endpoints-localstack.md).
