# 03. State, variables, outputs

## State — Terraform's memory

The file **`terraform.tfstate`** (JSON) stores:

- Resource IDs in AWS (`arn`, `bucket`, …)
- Dependencies between resources
- Metadata for the next `plan`

Without state, Terraform doesn't know that the bucket `course-lab` is the **same** resource as `aws_s3_bucket.lab`.

```text
resource "aws_s3_bucket" "lab"  ←── terraform.tfstate ──→  real bucket in AWS/LocalStack
```

**Never edit state manually** without `terraform state` commands (except recovery).

## Remote state (briefly)

In a team, state lives in S3:

```hcl
terraform {
  backend "s3" {
    bucket         = "company-tfstate"
    key            = "aws/prod/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "tf-lock"
    encrypt        = true
  }
}
```

+ **state locking** — two `apply` runs don't break the infrastructure.

## Variables

| Declaration type | Example |
|---|---|
| `variable` | Input parameters |
| `locals` | Computed constants inside a module |
| `terraform.tfvars` | Default values for an environment |
| `-var` / `TF_VAR_*` | Override from CLI/CI |

```hcl
variable "environment" {
  type        = string
  description = "dev | staging | prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

locals {
  bucket_prefix = "course-${var.environment}"
}
```

## Outputs

Pass values **outward** — to CI, another module, or a person:

```hcl
output "lambda_function_name" {
  value       = aws_lambda_function.resize.function_name
  description = "Name for aws lambda invoke"
}
```

```bash
terraform output bucket_name
terraform output -json
```

## Sensitive data

```hcl
output "db_password" {
  value     = var.db_password
  sensitive = true
}
```

Secrets can still end up in state — better to use **Secrets Manager** + a data source, not a variable with a password in plain text.

## Workspaces (briefly)

```bash
terraform workspace new dev
terraform workspace new prod
```

One codebase — different state files. An alternative is separate directories or `-var-file=prod.tfvars`.

## Lifecycle meta-arguments

```hcl
resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name

  lifecycle {
    prevent_destroy = true   # terraform destroy won't delete it
    ignore_changes  = [tags] # don't change on tags drift
  }
}
```

## Checklist

- Why is state needed?
- How does `variable` differ from `local`?
- Where do you set values for prod without committing to Git?
- Why does `sensitive = true` not mean "the secret is not in state"?

Next lesson: [04-lab-state-and-variables.md](04-lab-state-and-variables.md).
