# 05. Лаба: первый boto3-вызов — STS get_caller_identity

## Сценарий

Перед работой с S3 нужно убедиться: **credentials резолвятся**, **endpoint достижим**, **region корректен**. Стандартный «ping» — STS `GetCallerIdentity`. Это первый вызов, который делает [`lab_cli.py health`](../../deploy/python-aws/stack/lab_cli.py).

**Цель:** вызвать STS из lab container и с хоста; понять response; связать с health check.

---

## Шаг 1. STS из lab container

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
identity = client('sts').get_caller_identity()
print(identity)
"
```

Ожидаемый dict:

```python
{
    'UserId': '...',
    'Account': '000000000000',  # LocalStack fake account
    'Arn': 'arn:aws:iam::000000000000:user/localstack',
}
```

---

## Шаг 2. lab_cli health

```bash
docker exec mock-python-aws-lab python lab_cli.py health
```

Реализация:

```python
def cmd_health() -> int:
    c = client("sts")
    c.get_caller_identity()
    print('{"status":"ok","framework":"python-aws-lab"}')
    return 0
```

Если STS ok — boto3 pipeline (Session → endpoint → signing) работает.

---

## Шаг 3. С хоста (optional)

```bash
cd deploy/python-aws/stack
pip install -r requirements.txt

export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

python -c "from shop_aws.clients import client; print(client('sts').get_caller_identity())"
```

---

## Шаг 4. AWS CLI equivalent

```bash
aws sts get-caller-identity \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

Сравните поля с boto3 response — те же данные, другой интерфейс ([01-boto3-landscape](01-boto3-landscape.md)).

---

## Шаг 5. Намеренный fail — учебный

Wrong endpoint:

```bash
docker exec -e AWS_ENDPOINT_URL=http://localhost:9999 mock-python-aws-lab \
  python lab_cli.py health
```

→ connection error — диагностика **infra**, не IAM. В **real AWS** неверные keys → `InvalidClientTokenId`.

---

## Шаг 6. Мини-скрипт identity.py

```python
#!/usr/bin/env python3
from shop_aws.clients import client
from shop_aws.config import settings

def main():
    ident = client("sts").get_caller_identity()
    print(f"Account: {ident['Account']}")
    print(f"ARN: {ident['Arn']}")
    print(f"Region: {settings.region}")
    print(f"Endpoint: {settings.endpoint_url}")

if __name__ == "__main__":
    main()
```

---

## Критерии приёмки

- [ ] `get_caller_identity()` успешен в container
- [ ] `lab_cli.py health` → status ok
- [ ] Понимаете разницу STS error vs connection error
- [ ] Можете повторить вызов с хоста через env

Далее: [06-errors-retries-paginators](06-errors-retries-paginators.md).
