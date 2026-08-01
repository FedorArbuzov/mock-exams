# 10. Local AWS emulation: LocalStack and MiniStack

## Why emulate AWS

The course and labs shouldn't require **a card and the risk of a bill**. A local emulator gives you:

- The same **APIs** that Terraform and the AWS CLI expect.
- A repeatable environment on your laptop (Docker).
- Preparation for **real AWS** without billing surprises.

## LocalStack

The **industry standard** for dev/test. It emulates **40+ services** (S3, Lambda, DynamoDB, SQS, IAM, EC2 in a simplified form).

```bash
docker run --rm -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```

| Pros | Cons |
|---|---|
| Large community, documentation | Demanding on RAM (~500MB+) |
| Integration with `tflocal` | Pro features are paid |
| Parity with Terraform/AWS CLI | Not 100% like production AWS |

**Default endpoint:** `http://localhost:4566`

## MiniStack

**MIT**, lightweight (~30MB RAM), **41 services**, the same port `4566`.

```bash
docker run --rm -p 4566:4566 ministackorg/ministack
```

| Pros | Cons |
|---|---|
| Completely free | Smaller community |
| Fast startup | A younger project (2025+) |

Both work for the course; pick one and lock it into the lab README.

## Configuring the AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

aws --endpoint-url=http://localhost:4566 s3 mb s3://my-course-bucket-123
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Terraform: provider endpoints

Without `tflocal` — specify the endpoints explicitly:

```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  endpoints {
    s3         = "http://localhost:4566"
    dynamodb   = "http://localhost:4566"
    lambda     = "http://localhost:4566"
    sqs        = "http://localhost:4566"
    iam        = "http://localhost:4566"
  }
}
```

For S3 in LocalStack you sometimes need:

```hcl
s3_use_path_style = true
```

(in the `aws` provider or via `tflocal`, which sets it for you).

## tflocal — one codebase for local and cloud

```bash
pip install terraform-local
tflocal init
tflocal apply
```

**`tflocal`** wraps `terraform` and automatically configures the endpoints for LocalStack. The `.tf` code for the lessons can be kept **without** a hardcoded `localhost` in the repository — the student chooses `terraform apply` vs `tflocal apply`.

## Emulation limitations

| In production | In the emulator |
|---|---|
| Multi-AZ RDS failover | Simplified or absent |
| Real latency / limits | Different |
| All IAM edge cases | Partial |
| CloudFront, some services | Absent or stubbed |

**Rule:** after the course, run the critical scenario once in a **real** dev account with a budget alert.

## Final project (preview)

The architecture for the `aws-terraform` course (the next track):

```text
[Client]
    → presigned PUT → S3 bucket (uploads/)
    → S3 event → Lambda (resize)
        → S3 (thumbs/)
        → DynamoDB (metadata)
    → optional: SQS DLQ on Lambda errors
```

Everything is deployed via Terraform on LocalStack/MiniStack.

## Docker Compose (optional for the repository)

Later you can add `deploy/localstack/docker-compose.yml` to the repository — a single `docker compose up` for the whole class.

## Checklist

- What port does LocalStack listen on?
- Why `skip_credentials_validation`?
- How does `tflocal apply` differ from `terraform apply`?
- Name 3 limitations of the emulator.
- What endpoint do you use for `aws s3 ls` locally?

---

**The aws-basic theory is complete.** Next comes the [aws-terraform](../aws-terraform/README.md) course.
