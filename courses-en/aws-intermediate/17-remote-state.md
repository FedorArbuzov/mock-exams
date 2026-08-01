# 17. Remote state and environments

## The local state problem

`terraform.tfstate` on a laptop:

- not in CI/CD,
- team conflicts,
- risk of losing the file.

## S3 backend + DynamoDB lock

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "image-platform/dev/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

| Component | Role |
|---|---|
| S3 bucket | state storage (enable versioning) |
| DynamoDB | pessimistic lock (`LockID`) |
| encryption | SSE-S3 or KMS |

Bootstrap: the state bucket is created **once** manually or via a separate “bootstrap” stack.

## Workspaces

```bash
terraform workspace new dev
terraform workspace new prod
terraform workspace select dev
```

One codebase — state prefix `env:/dev/...` vs `env:/prod/...`.

## Alternative: directories

```text
environments/
  dev/
    main.tf      → module "../../platform" { ... }
  prod/
    main.tf
```

Clearer for code review, more common in enterprise.

## tfvars per env

```hcl
# dev.tfvars
environment = "dev"
bucket_name = "course-images-dev-001"

# prod.tfvars
environment = "prod"
bucket_name = "course-images-prod-001"
```

## LocalStack backend

For learning keep a **local** backend or `terraform { backend "local" {} }`. Remote state lab — against a **real** S3 bucket (free tier).

## Checklist

- Why DynamoDB lock?
- Bootstrap problem — what is it?
- Workspaces vs separate directories?
- Why is the state bucket not in the same apply?

Next lesson: [18-lab-remote-state.md](18-lab-remote-state.md).
