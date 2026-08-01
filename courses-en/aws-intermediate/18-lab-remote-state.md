# 18. Lab: S3 backend (real AWS)

> Run in a **dev-account**. Do not use a LocalStack backend for state in a production pattern.

## Task 1. Bootstrap (once)

`bootstrap/main.tf`:

```hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "course-tfstate-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_dynamodb_table" "lock" {
  name         = "course-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

```bash
cd bootstrap && terraform apply
```

## Task 2. Backend in platform

```hcl
terraform {
  backend "s3" {
    bucket         = "course-tfstate-ACCOUNT_ID"
    key            = "image-platform/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "course-terraform-locks"
    encrypt        = true
  }
}
```

`terraform init -migrate-state` — migrate local → remote.

## Task 3. Workspaces

```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace select dev
terraform apply -var-file=dev.tfvars
```

## Task 4. Lock verification

In two terminals at once `terraform apply` — the second should wait on the lock.

## Success criteria

- [ ] State in S3, versioning on
- [ ] Concurrent apply is blocked
- [ ] `workspace list` shows dev/staging

Next lesson: [19-cloudwatch.md](19-cloudwatch.md).
