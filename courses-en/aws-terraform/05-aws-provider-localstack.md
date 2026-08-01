# 05. The AWS provider and endpoints for LocalStack

## The hashicorp/aws provider

The plugin talks to the **AWS API**. For LocalStack, the same calls go to `http://localhost:4566`.

Key settings for emulation:

| Parameter | Why |
|---|---|
| `access_key` / `secret_key` | Any values (`test`/`test`) |
| `skip_credentials_validation` | Don't call the real STS |
| `skip_requesting_account_id` | Don't request the account id |
| `skip_metadata_api_check` | No EC2 metadata on a laptop |
| `s3_use_path_style = true` | S3 path-style URLs for LocalStack |
| `endpoints { ... }` | Override service URLs |

## Full endpoints block

```hcl
provider "aws" {
  region = var.aws_region

  access_key                  = var.aws_access_key
  secret_key                  = var.aws_secret_key
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    s3       = var.localstack_endpoint
    dynamodb = var.localstack_endpoint
    lambda   = var.localstack_endpoint
    iam      = var.localstack_endpoint
    sqs      = var.localstack_endpoint
    sts      = var.localstack_endpoint
    logs     = var.localstack_endpoint
  }
}
```

Not every service is needed in every project — add them as you use them.

## Switching local ↔ real AWS

A pattern **without** duplicating `.tf`:

```hcl
variable "use_localstack" {
  type    = bool
  default = true
}

provider "aws" {
  region = var.aws_region

  dynamic "endpoints" {
    for_each = var.use_localstack ? [1] : []
    content {
      s3       = var.localstack_endpoint
      dynamodb = var.localstack_endpoint
      lambda   = var.localstack_endpoint
      iam      = var.localstack_endpoint
    }
  }

  # for real AWS — credentials from env AWS_PROFILE / IAM role
  access_key = var.use_localstack ? "test" : null
  secret_key = var.use_localstack ? "test" : null
  skip_credentials_validation = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  s3_use_path_style           = var.use_localstack
}
```

`prod.tfvars`: `use_localstack = false`.

## Docker Compose from the repository

```yaml
# deploy/localstack/docker-compose.yml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,lambda,dynamodb,iam,sqs,sts,logs
```

`LAMBDA_EXECUTOR=docker` — Lambda in LocalStack runs containers (a Docker socket is required).

## MiniStack

The same port `4566`, the same endpoints. Replace the image in the compose file or:

```bash
docker run --rm -p 4566:4566 ministackorg/ministack
```

## Limitations

- Not every resource type works the same way (especially VPC, RDS).
- The AWS provider version and the LocalStack version must be compatible — for strange errors, check the [LocalStack docs](https://docs.localstack.cloud/).

## Checklist

- Why `s3_use_path_style`?
- Which `skip_*` are only needed for LocalStack?
- How do you switch a single `.tf` to prod?

Next lesson: [06-lab-aws-provider-localstack.md](06-lab-aws-provider-localstack.md).
