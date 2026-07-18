# 31. Secrets Manager и SSM Parameter Store

## Введение: «API key в git — incident за 20 минут»

`.env` с `STRIPE_KEY=sk_live_...` закоммичен. Rotating key требует redeploy всех сервисов. **AWS Secrets Manager** и **SSM Parameter Store** — central secret storage с IAM access и (для Secrets Manager) rotation hooks.

LocalStack: `secretsmanager` в SERVICES ([`docker-compose.yml`](../../deploy/python-aws/docker-compose.yml)).

## Что вы узнаете

- Secrets Manager vs SSM — когда что.
- `create_secret`, `get_secret_value`.
- SSM `put_parameter`, `get_parameter`, tiers.
- Lambda env vs runtime fetch.

---

## Secrets Manager vs SSM

| | Secrets Manager | SSM Parameter Store |
|--|-----------------|---------------------|
| Cost | per secret + API | Standard free tier |
| Rotation | built-in Lambda | manual / external |
| JSON blobs | yes | string (can JSON) |
| Use case | DB creds, API keys | config flags, non-rotating |
| Path | secret name/ARN | `/shop/prod/db/host` |

Rule: **rotating credentials** → Secrets Manager; **config** → SSM.

---

## create_secret (boto3)

```python
from shop_aws.clients import client
import json

sm = client("secretsmanager")
sm.create_secret(
    Name="shop/api/stripe",
    SecretString=json.dumps({
        "api_key": "sk_test_localstack",
        "webhook_secret": "whsec_test",
    }),
)
```

| Field | Note |
|-------|------|
| `Name` | unique per region |
| `SecretString` | or `SecretBinary` |
| `KmsKeyId` | CMK in prod |

---

## get_secret_value

```python
resp = sm.get_secret_value(SecretId="shop/api/stripe")
raw = resp["SecretString"]
data = json.loads(raw)
api_key = data["api_key"]
```

| Response key | When |
|--------------|------|
| `SecretString` | text/JSON |
| `SecretBinary` | bytes base64 |

Cache in Lambda **outside** handler with TTL — reduce API calls and cost.

---

## update_secret / rotation

```python
sm.put_secret_value(
    SecretId="shop/api/stripe",
    SecretString=json.dumps({"api_key": "sk_new", "webhook_secret": "whsec_new"}),
)
```

Production rotation: Lambda rotates DB password → `ModifySecret` → apps refresh on next fetch.

Course [secrets-advanced](../secrets-advanced/README.md) — Vault contrast.

---

## SSM Parameter Store

```python
ssm = client("ssm")
ssm.put_parameter(
    Name="/shop/config/max_upload_mb",
    Value="25",
    Type="String",
    Overwrite=True,
)
val = ssm.get_parameter(Name="/shop/config/max_upload_mb")["Parameter"]["Value"]
```

| Type | Use |
|------|-----|
| `String` | plain config |
| `StringList` | comma-separated |
| `SecureString` | encrypted with KMS |

Hierarchy: `/shop/prod/`, `/shop/dev/` — IAM path conditions.

---

## Lambda integration patterns

| Pattern | Pros | Cons |
|---------|------|------|
| Env var at deploy | fast cold start | secret in console/config |
| Fetch on cold start | not in env snapshot | API latency |
| Extension (AWS) | cache + rotation | infra complexity |

Lab: fetch in handler with `get_secret_value` — explicit boto3.

---

## IAM least privilege

```json
{
  "Effect": "Allow",
  "Action": ["secretsmanager:GetSecretValue"],
  "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:shop/api/stripe-*"
}
```

SSM:

```json
{
  "Action": ["ssm:GetParameter"],
  "Resource": "arn:aws:ssm:us-east-1:*:parameter/shop/config/*"
}
```

LocalStack lab roles often `*` — prod never.

---

## LocalStack bootstrap secret

```python
def ensure_stripe_secret():
    sm = client("secretsmanager")
    name = "shop/api/stripe"
    try:
        sm.get_secret_value(SecretId=name)
    except sm.exceptions.ResourceNotFoundException:
        sm.create_secret(Name=name, SecretString='{"api_key":"sk_test_lab"}')
```

Add to bootstrap script optionally.

---

## Never do

| Anti-pattern | Risk |
|--------------|------|
| Log secret value | leak in CloudWatch |
| Commit `.env` prod | git history forever |
| Same secret dev/prod | blast radius |
| Hardcode in zip | artifact exposure |

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Wrong SecretId region | ResourceNotFound |
| Parse SecretString forget JSON | str has no attribute get |
| No IAM on Lambda role | AccessDeniedException |
| Cache forever after rotation | auth failures |

## Резюме

**Secrets Manager** — sensitive rotatable JSON; **SSM** — config hierarchy. Lambda читает через boto3 + IAM. Не храните production secrets в git или plain env. Lab — secret в handler.

Далее: [32-lab-secrets-lambda](32-lab-secrets-lambda.md).
