# 01. Terraform: HCL, provider, plan/apply

## Why IaC

**Infrastructure as Code** — infrastructure is described in files, versioned in Git, and checked in CI. Instead of "I created a bucket in the Console" — `terraform apply` from the same commit as the application code.

| Approach | Pros | Cons |
|---|---|---|
| Console / CLI manually | Fast for experiments | Drift, no history, human error |
| CloudFormation (AWS) | Native to AWS | AWS only, YAML/JSON |
| **Terraform** | Multi-cloud, HCL, ecosystem | State must be protected |

## How Terraform works

```text
.tf files (HCL)
    → terraform plan  (what will change?)
    → terraform apply (create/modify/delete)
    → Provider API (AWS, Kubernetes, ...)
    → State file (terraform.tfstate) — a map "resource in code ↔ id in the cloud"
```

Terraform is **declarative**: you describe the desired state, and the engine computes the diff.

## HCL — minimal example

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "course" {
  bucket = "my-unique-bucket-name-12345"
}
```

| Block | Purpose |
|---|---|
| `terraform` | Terraform and provider versions |
| `provider` | Plugin settings (region, credentials) |
| `resource` | The object to create (`<provider>_<type>.<name>`) |
| `data` | Reading existing resources (not in the first lesson) |

## Command lifecycle

```bash
terraform init      # download providers, backend
terraform fmt       # format .tf files
terraform validate  # syntax
terraform plan      # plan of changes
terraform apply     # apply (confirmation or -auto-approve)
terraform destroy   # delete everything from state
```

**init** is required after cloning the repo or changing `required_providers`.

## Resource graph

Terraform builds a dependency graph. If a Lambda references an IAM Role, the role is created first (`depends_on` is usually not needed — attribute references are enough).

## Idempotency

A repeat `apply` with no changes in `.tf` → `No changes`. This is the goal of IaC.

## What NOT to keep in Git

- `terraform.tfstate` with secrets — for solo labs, keeping it locally is OK; in a team, use a **remote backend** (S3 + DynamoDB lock).
- `*.tfvars` with passwords — in `.gitignore`.

## Checklist

- How does `plan` differ from `apply`?
- Why `terraform init`?
- What is `resource` vs `provider`?
- Where does Terraform store the mapping of resource names to IDs in AWS?

Next lesson: [02-lab-terraform-intro.md](02-lab-terraform-intro.md).
