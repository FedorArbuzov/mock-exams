# 05. Lab: first boto3 call — STS get_caller_identity

## Scenario

Before working with S3 you need to confirm: **credentials resolve**, **the endpoint is reachable**, **the region is correct**. The standard "ping" is STS `GetCallerIdentity`. This is the first call that [`lab_cli.py health`](../../deploy/python-aws/stack/lab_cli.py) makes.

**Goal:** call STS from the lab container and from the host; understand the response; connect it to the health check.

---

## Step 1. STS from the lab container

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
identity = client('sts').get_caller_identity()
print(identity)
"
```

Expected dict:

```python
{
    'UserId': '...',
    'Account': '000000000000',  # LocalStack fake account
    'Arn': 'arn:aws:iam::000000000000:user/localstack',
}
```

---

## Step 2. lab_cli health

```bash
docker exec mock-python-aws-lab python lab_cli.py health
```

Implementation:

```python
def cmd_health() -> int:
    c = client("sts")
    c.get_caller_identity()
    print('{"status":"ok","framework":"python-aws-lab"}')
    return 0
```

If STS is ok — the boto3 pipeline (Session → endpoint → signing) works.

---

## Step 3. From the host (optional)

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

## Step 4. AWS CLI equivalent

```bash
aws sts get-caller-identity \
  --endpoint-url http://localhost:4566 \
  --region us-east-1
```

Compare the fields with the boto3 response — same data, different interface ([01-boto3-landscape](01-boto3-landscape.md)).

---

## Step 5. Intentional fail — a learning exercise

Wrong endpoint:

```bash
docker exec -e AWS_ENDPOINT_URL=http://localhost:9999 mock-python-aws-lab \
  python lab_cli.py health
```

→ connection error — diagnosing **infra**, not IAM. In **real AWS** wrong keys → `InvalidClientTokenId`.

---

## Step 6. Mini-script identity.py

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

## Success criteria

- [ ] `get_caller_identity()` succeeds in the container
- [ ] `lab_cli.py health` → status ok
- [ ] You understand the difference between an STS error and a connection error
- [ ] You can repeat the call from the host via env

Next: [06-errors-retries-paginators](06-errors-retries-paginators.md).
