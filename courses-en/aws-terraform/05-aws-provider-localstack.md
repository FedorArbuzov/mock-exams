# 05. Why the provider looks like that

Lab 02 already applied to LocalStack. This page is only *why* that `provider` block looks so noisy — and the **full `endpoints` map** you paste into **this** project (IAM, Lambda).

The AWS provider always speaks the **AWS API**. Real AWS is a set of **different hostnames per service**:

| Call | Default destination |
|---|---|
| S3 `CreateBucket` | `s3.<region>.amazonaws.com` |
| IAM `CreateRole` | `iam.amazonaws.com` |
| Lambda `CreateFunction` | `lambda.<region>.amazonaws.com` |
| STS, logs, … | each has its own host |

LocalStack is one process on **`http://localhost:4566`**. It pretends to be all of those APIs. `endpoints { s3 = "...", iam = "...", lambda = "..." }` means: for *this* service, do not use Amazon’s hostname — use `:4566`.

Without a key, that service still goes to real AWS. `test`/`test` then fails (or, if a real profile is set, you may create resources in a real account). `skip_*` only skips extra checks (STS, IMDS); it does **not** redirect API calls.

| Setting | Why lab 02 needed it |
|---|---|
| `access_key` / `secret_key` = `test` | LocalStack accepts anything |
| `skip_credentials_validation` | Do not call real STS to validate the key |
| `skip_requesting_account_id` | Do not ask AWS for an account id |
| `skip_metadata_api_check` | No EC2 metadata on a laptop |
| `s3_use_path_style` | LocalStack wants `/bucket`, not `bucket.s3.amazonaws.com` |

Hello world only listed `s3`. Next labs need more keys. **Prerequisite:** paste the map below (lab 06) into the same `provider` block.

```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    s3     = "http://localhost:4566"
    lambda = "http://localhost:4566"
    iam    = "http://localhost:4566"
    sts    = "http://localhost:4566"
  }
}
```

That is everything this course talks to. [`aws-intermediate`](../aws-intermediate/README.md) adds more keys (`dynamodb`, `sqs`, `apigateway`, `secretsmanager`, …) the same way.

On **real AWS** you omit `endpoints` and the dummy keys. A `use_localstack` flag (same idea, `dynamic "endpoints"`) is optional if you later share one module between laptop and an account — not required for this course.

LocalStack is already running from ENVIRONMENT.md. This course pins **3.8**. VPC/RDS are the usual local gaps.

## Next

Paste the map so later labs have a working provider: [06-lab-aws-provider-localstack.md](06-lab-aws-provider-localstack.md).
