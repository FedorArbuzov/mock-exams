# 04. Lab: variables, locals, outputs

Same folder as lab 02: **`~/aws-labs`**. Do not `init` a new project. You already have `main.tf`, state, and a bucket. Here you **stop hardcoding the name**: values move into variables, you apply **dev** with a `.tfvars` file, Check looks for that bucket.

> **Interactive check.** After `terraform apply -var-file=dev.tfvars`, **Check** looks for bucket **`course-lab-hello-dev`**. Start lab deletes that bucket if it already exists. Do **not** `destroy` before Check.

## How the files find each other

Terraform reads **all `*.tf` in this directory** as one module. There is no `import`. A `variable` declared in `variables.tf` is `var.something` everywhere else. A `locals` block in `locals.tf` is `local.something`. Resources in `main.tf` are `aws_s3_bucket.hello`.

`.tfvars` is different: it is **not** loaded just because it sits in the folder. You pass it on the command line (`-var-file=dev.tfvars`). That is how `bucket_name = "course-lab-hello-dev"` reaches `var.bucket_name`.

```text
dev.tfvars          -var-file=...     fills
       │
       ▼
variables.tf        declares slots     var.bucket_name, var.environment, var.project
       │
       ▼
locals.tf           builds a map       local.common_tags  (uses var.*)
       │
       ▼
main.tf             creates the bucket bucket = var.bucket_name
                                       tags   = local.common_tags
       │
       ▼
outputs.tf          prints after apply terraform output tags
```

When you are done, the folder looks like this (plus `.terraform/` and `terraform.tfstate` from lab 02):

```text
~/aws-labs/
  main.tf          ← edit the resource (name + tags)
  variables.tf     ← new
  locals.tf        ← new
  outputs.tf       ← new
  dev.tfvars       ← new (Check uses this apply)
  staging.tfvars   ← new (you apply this only if you want; Check does not)
```

## Prep

```bash
cd ~/aws-labs
```

If lab 02’s bucket is still in state, the next `apply` will **replace** it (new name). That is expected.

## Task 1. `variables.tf` (new file)

These are **empty slots**. They do not create AWS objects. `bucket_name` has no `default`, so Terraform will refuse to plan until you pass a value (the `.tfvars` in task 5).

```hcl
variable "bucket_name" {
  type        = string
  description = "S3 bucket name"
}

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

## Task 2. `locals.tf` (new file)

**Why:** `environment` and `project` are inputs. The tag map is *computed* from them (`ManagedBy = "terraform"` is not something the caller should type every time). Put that map in one place (`local.common_tags`) and attach it to the bucket — and later to IAM and Lambda — without repeating three keys. If you inlined the map on the resource, the next resource would drift.

A local is not an AWS object and not a CLI flag. `var.project` works here because `variables.tf` is in the same folder.

```hcl
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

## Task 3. Edit `main.tf` — wire the bucket to the variables

Keep the `terraform { }` and `provider "aws" { }` blocks from lab 02. Change **only** the resource: drop the hardcoded S3 name, use `var.bucket_name`, attach tags **on the bucket** (provider 5.x did *not* split tags out — unlike ACL / encryption in later labs).

```hcl
resource "aws_s3_bucket" "hello" {
  bucket = var.bucket_name
  tags   = local.common_tags
}
```

`local.common_tags` is the map from `locals.tf`. `"hello"` is still the Terraform local name (`aws_s3_bucket.hello` in state). The **S3** name now comes from the variable.

## Task 4. `outputs.tf` (new file)

**Why:** after apply, the useful facts live in state (bucket id, tags, later: Lambda ARN). Scripts and CI should not parse `terraform.tfstate`. An `output` is the public API of this folder: `terraform output tags` (or `-json` in a pipeline). In this lab you export the tag map so you can *see* it without opening state. Later labs export names/ARNs so the next tool can consume them.

They read from the same module (here: the local map — you could equally output `aws_s3_bucket.hello.id`).

```hcl
output "tags" {
  value       = local.common_tags
  description = "Tags applied to the bucket"
}
```

After a successful apply: `terraform output tags`.

## Task 5. Two `.tfvars` files + apply **dev**

These files only assign the slots from task 1. They are not Terraform config.

`dev.tfvars`:

```hcl
bucket_name = "course-lab-hello-dev"
environment = "dev"
```

`staging.tfvars` (same pattern, different name — Check does **not** use this file):

```hcl
bucket_name = "course-lab-hello-staging"
environment = "staging"
```

Apply **dev** (this is what Check needs):

```bash
terraform apply -var-file=dev.tfvars
```

Without `-var-file`, `bucket_name` is unset and plan fails or prompts. That is the whole point of this lab.

**What you'll see:** plan to create (or replace) a bucket named `course-lab-hello-dev`, tags including `Environment = dev`.

Optional — prove staging is just another file:

```bash
terraform plan -var-file=staging.tfvars
```

Do **not** apply staging before Check: one state file cannot honestly own two bucket names at once. Stay on dev.

## Task 6. Inspect state

```bash
terraform state list
terraform state show aws_s3_bucket.hello
terraform output tags
```

**What you'll see:** address `aws_s3_bucket.hello`, id/name `course-lab-hello-dev`, tags from the local map.

## Task 7. Validation

Add this inside `variable "environment"` in `variables.tf` (same file as task 1):

```hcl
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
```

Then:

```bash
terraform plan -var-file=dev.tfvars -var="environment=invalid"
```

Terraform should error **before** talking to LocalStack. (`-var` overrides the value from the tfvars file.)

## Check

In the UI, press **Check**. The bucket `course-lab-hello-dev` must still exist. Skip **Cleanup** and do **not** destroy — IAM and Lambda land in this folder next.

Destroy is only at the end of the course (`terraform destroy -var-file=dev.tfvars`). Destroy still needs `var.bucket_name`, so you pass the same `-var-file` as apply.

## Success criteria

- [ ] Folder has `variables.tf`, `locals.tf`, `outputs.tf`, `dev.tfvars` (and `main.tf` uses `var.bucket_name`)
- [ ] UI Check is green for `course-lab-hello-dev`
- [ ] `terraform output tags` shows `Environment = "dev"`
- [ ] `plan -var="environment=invalid"` fails validation

## Common mistakes

| What happened | Why |
|---|---|
| `No value for required variable` | You ran `apply` without `-var-file=dev.tfvars` |
| Check red, bucket is still `nimbus-tf-hello` | You did not apply after switching to `var.bucket_name` + `dev.tfvars` |
| Check red, you applied `staging.tfvars` | Check wants the **dev** name |
| `Invalid resource type aws_s3_bucket_tags` | Tags belong **on** `aws_s3_bucket` in this provider, not a separate resource |
| Destroy asks for `bucket_name` | Pass `-var-file=dev.tfvars` again |

Next lesson: [05-aws-provider-localstack.md](05-aws-provider-localstack.md).
