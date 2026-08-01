# 04. Config: endpoints, credentials, regions

## Intro: "works in Docker, fails on the laptop — endpoint_url"

A developer runs a script on the host without `AWS_ENDPOINT_URL`. boto3 goes to **real AWS** → `NoSuchBucket` or worse — it writes into a **production bucket**. Another classic — region `eu-west-1` in the code, bucket in `us-east-1`.

AWS SDK configuration is **12-factor**: everything through env. Reference: [`shop_aws/config.py`](../../deploy/python-aws/stack/shop_aws/config.py).

## What you'll learn

- The boto3 credential chain and dummy keys for LocalStack.
- `endpoint_url` — when and how.
- Region, resource names, the pydantic-settings pattern.

---

## Environment variables (environment)

| Env var | Default (lab) | Purpose |
|---------|---------------|------------|
| `AWS_ENDPOINT_URL` | `http://localhost:4566` | LocalStack gateway |
| `AWS_ACCESS_KEY_ID` | `test` | access key |
| `AWS_SECRET_ACCESS_KEY` | `test` | secret key |
| `AWS_DEFAULT_REGION` | `us-east-1` | region |
| `SHOP_BUCKET` | `shop-uploads` | bucket name |
| `SHOP_TABLE` | `shop-items` | DynamoDB table |
| `SHOP_QUEUE` | `shop-events` | SQS queue |

In Docker Compose the lab container gets `http://localstack:4566` (hostname inside the network). From the **host** — `http://localhost:4566`.

---

## Settings class

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    endpoint_url: str | None = Field(
        default="http://localhost:4566",
        validation_alias="AWS_ENDPOINT_URL",
    )
    region: str = Field(default="us-east-1", validation_alias="AWS_DEFAULT_REGION")
    access_key: str = Field(default="test", validation_alias="AWS_ACCESS_KEY_ID")
    secret_key: str = Field(default="test", validation_alias="AWS_SECRET_ACCESS_KEY")
    shop_bucket: str = Field(default="shop-uploads", validation_alias="SHOP_BUCKET")
```

| Pattern | Why |
|---------|-------|
| `validation_alias` | standard AWS env names |
| `extra="ignore"` | don't fail on extra vars |
| `endpoint_url: str \| None` | `None` = real AWS |

---

## Credential resolution order

boto3 checks (simplified):

1. Explicit `Session(...)` arguments
2. Env vars `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
3. `AWS_PROFILE` → shared credentials file
4. **IAM role** (EC2 instance profile, ECS task role, Lambda execution role)
5. SSO / Web identity

LocalStack accepts **any** non-empty keys — `test`/`test` is enough. Production: **never** long-lived keys in code — only a role.

---

## endpoint_url per service

```python
def client(service: str):
    kwargs = {}
    if settings.endpoint_url:
        kwargs["endpoint_url"] = settings.endpoint_url
    return boto_session().client(service, **kwargs)
```

LocalStack is a **single gateway** `:4566` for all services. In real AWS you **don't set** `endpoint_url`.

| Environment | endpoint_url |
|-------|--------------|
| LocalStack host | `http://localhost:4566` |
| LocalStack docker lab | `http://localstack:4566` |
| AWS prod | `None` |

---

## Region matters

| Error | Cause |
|--------|---------|
| `PermanentRedirect` | bucket in a different region |
| `ResourceNotFoundException` | table in a different region |
| Signature mismatch | clock skew / wrong region |

S3 bucket names are **global**; DynamoDB/SQS are **regional**. The Session's `region_name` must match the resource.

---

## Resource naming

The application **does not create** a bucket in prod on every request — it reads the name from env:

```python
self.bucket = settings.shop_bucket  # SHOP_BUCKET
```

Terraform/CDK creates the resource → CI injects env → the app uses boto3. Bootstrap in labs is an exception for local dev.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| Hardcoding `localhost:4566` in code | CI/docker hostname break |
| Forgetting to unset the endpoint in prod | latency / wrong routing |
| One bucket name for dev/prod | data leak |
| Committing `.env` with real keys | security incident |

## Summary

**Env-driven config** is the standard for boto3. LocalStack: dummy creds + `endpoint_url`. Production: IAM roles, no endpoint override. Centralize in `Settings` + the `clients.py` factory.

Next: [05-lab-first-boto3-call](05-lab-first-boto3-call.md).
