# 04. Lab: variables, locals, outputs

We continue the project from lesson 02. We'll add `environment`, `locals`, and a conditional tag.

## Task 1. Extend variables.tf

```hcl
variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment label"
}

variable "project" {
  type    = string
  default = "aws-course"
}
```

## Task 2. locals.tf

```hcl
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

## Task 3. Tags on the bucket (AWS provider 5.x)

In provider 5.x, tags are a separate resource:

```hcl
resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_tags" "lab" {
  bucket = aws_s3_bucket.lab.id
  tags   = local.common_tags
}
```

## Task 4. output with metadata

```hcl
output "tags" {
  value = local.common_tags
}
```

## Task 5. Two environments via tfvars

`dev.tfvars`:

```hcl
bucket_name = "course-dev-yourname-123"
environment = "dev"
```

`staging.tfvars`:

```hcl
bucket_name = "course-staging-yourname-123"
environment = "staging"
```

Apply dev:

```bash
terraform apply -var-file=dev.tfvars
```

**What you'll see:** a different bucket name, the tag `Environment = dev`.

## Task 6. Inspect the state

```bash
terraform state list
terraform state show aws_s3_bucket.lab
```

**What you'll see:** the real bucket id and its attributes — what Terraform remembered.

## Task 7. Validation

Add the `validation` block from lesson 03 to `variable "environment"`. Try:

```bash
terraform plan -var="environment=invalid"
```

There should be an error before any call to AWS.

## Success criteria

- [ ] `terraform output tags` shows common_tags
- [ ] `state list` contains the bucket and tags resource
- [ ] validation rejects an invalid environment

Next lesson: [05-aws-provider-localstack.md](05-aws-provider-localstack.md).
