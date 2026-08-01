# 19. Terraform modules

## Why modules

Repeated blocks (an S3 bucket with encryption + block public) are extracted into a **module** — write it once, call it in dev/staging/prod with different `tfvars`.

```text
root/
  main.tf          → module "images_bucket" { source = "./modules/s3-bucket" }
  modules/
    s3-bucket/
      main.tf
      variables.tf
      outputs.tf
```

## Calling a module

```hcl
module "uploads_bucket" {
  source = "./modules/s3-bucket"

  bucket_name = var.bucket_name
  tags        = local.common_tags
}

output "bucket_arn" {
  value = module.uploads_bucket.bucket_arn
}
```

## Module interface

`variables.tf` — inputs; `outputs.tf` — what we expose outward. Internal resources are not exported unless needed.

## Versioning

```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"
  # ...
}
```

Registry: [registry.terraform.io](https://registry.terraform.io/).

## State

Modules are part of the **single state** of the root module (not a separate state, unless a nested stack).

## When NOT to proliferate modules

For a single teaching project with 5 resources, a flat `.tf` is more readable. Modules pay off with 2–3 repetitions.

## Checklist

- How does `module` differ from `resource`?
- Where is the state for a submodule stored?
- Why does a module have `outputs`?

Next lesson: [20-lab-modules.md](20-lab-modules.md).
