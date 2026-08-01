# 20. Lab: S3 bucket module

## Task 1. modules/s3-bucket/

`variables.tf`:

```hcl
variable "bucket_name" { type = string }
variable "tags" {
  type    = map(string)
  default = {}
}
```

`main.tf` — bucket + public_access_block + encryption (from lesson 11).

`outputs.tf`:

```hcl
output "bucket_id" { value = aws_s3_bucket.this.id }
output "bucket_arn" { value = aws_s3_bucket.this.arn }
```

## Task 2. root main.tf

```hcl
module "images" {
  source      = "./modules/s3-bucket"
  bucket_name = var.bucket_name
  tags        = local.common_tags
}
```

Replace the direct `aws_s3_bucket` in lesson-18 with the module.

## Task 3. plan

```bash
tflocal plan
```

**Expectation:** replace or move — when a resource's address in state changes, you may need `terraform state mv` (an advanced step; for labs a new directory is simpler).

## Success criteria

- [ ] The module applies without errors
- [ ] The root outputs expose bucket_arn from the module

Next lesson: [21-ci-terraform.md](21-ci-terraform.md).
