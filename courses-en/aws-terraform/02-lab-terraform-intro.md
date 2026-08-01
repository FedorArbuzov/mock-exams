# 02. Lab: your first Terraform project

Goal: install Terraform, initialize a project, and create an S3 bucket **in LocalStack** (we'll start the emulator in lesson 06; here we cover the project structure and commands).

## Preparation

```bash
terraform version   # >= 1.5
mkdir -p ~/aws-labs/lesson-02
cd ~/aws-labs/lesson-02
```

While LocalStack isn't running yet, we prepare the files; you'll run `apply` in [06-lab-aws-provider-localstack.md](06-lab-aws-provider-localstack.md) or right after `docker compose up`.

## Task 1. versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## Task 2. provider.tf (stub — you'll add endpoints in lesson 06)

```hcl
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  s3_use_path_style = true

  endpoints {
    s3 = var.localstack_endpoint
  }
}
```

## Task 3. variables.tf

```hcl
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "localstack_endpoint" {
  type    = string
  default = "http://localhost:4566"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique bucket name"
}
```

## Task 4. main.tf

```hcl
resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "lab" {
  bucket = aws_s3_bucket.lab.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

## Task 5. outputs.tf

```hcl
output "bucket_name" {
  value = aws_s3_bucket.lab.id
}

output "bucket_arn" {
  value = aws_s3_bucket.lab.arn
}
```

## Task 6. terraform.tfvars

```hcl
bucket_name = "course-lab-02-yourname-123"
```

Replace `yourname` with a unique suffix.

## Task 7. Commands

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan -var-file=terraform.tfvars
```

After starting LocalStack:

```bash
terraform apply -var-file=terraform.tfvars
```

**What you'll see:** `Plan: 2 to add` (bucket + versioning). After apply — outputs.

Verification with AWS CLI:

```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Task 8. Cleanup

```bash
terraform destroy -var-file=terraform.tfvars
```

## Success criteria

- [ ] `init` runs without errors
- [ ] `plan` shows the bucket being created
- [ ] `apply` completed, bucket visible in `aws s3 ls`
- [ ] `destroy` removed the resources

## Common mistakes

| Error | Solution |
|---|---|
| `connection refused :4566` | Start LocalStack |
| `BucketAlreadyExists` | Change `bucket_name` |
| Provider auth error | Check `skip_*` and `access_key = "test"` |

Next lesson: [03-state-and-variables.md](03-state-and-variables.md).
