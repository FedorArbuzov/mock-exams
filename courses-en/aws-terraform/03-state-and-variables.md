# 03. State, variables, outputs

In lab 02 you ran `apply`. In the same folder Terraform wrote **`terraform.tfstate`**. Open it (it is JSON). You will see the bucket name, its ARN, and a lot of noise. That file is why a second `apply` said `No changes`: Terraform already knows `aws_s3_bucket.hello` **is** that bucket in LocalStack.

```text
main.tf  →  resource "aws_s3_bucket" "hello"
                ↕ terraform.tfstate
            LocalStack bucket nimbus-tf-hello
```

Without state, the next `apply` would try to create a second bucket (or fail with `BucketAlreadyExists`) because Terraform would not recognize the first one.

**Do not edit state in a text editor.** `terraform state list` / `show` / `rm` exist for a reason. If two people `apply` the same project at once, they can corrupt it — that is why teams put state in S3 with a **lock** (DynamoDB). You do not need a remote backend for these labs; keep `tfstate` on disk and out of Git.

## One folder is one module

Terraform does **not** `import` files. It loads **every `*.tf` in the current directory** and treats them as one program. `variable "bucket_name"` in `variables.tf` is visible in `main.tf` as `var.bucket_name`. Split files only so humans can read them.

`.tfvars` files are **not** in that merge. They are a bag of values you pass with `-var-file=dev.tfvars` (or name the file `terraform.tfvars` / `*.auto.tfvars` if you want it picked up automatically). Lab 04 uses `-var-file` on purpose so you see the link.

## Hardcoded names get old

`bucket = "nimbus-tf-hello"` was fine for hello world. The next lab should not edit `main.tf` every time the name or environment changes. That is what **variables** are for.

| You write | Meaning |
|---|---|
| `variable "bucket_name"` | Input. Caller must supply it (or a `default`). |
| `locals { ... }` | Computed inside the module. Not passed from outside. |
| `dev.tfvars` | Values for one environment. Pass `-var-file=dev.tfvars`. |
| `-var` / `TF_VAR_bucket_name` | One-off override from the shell or CI. |

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

`validation` fails *before* any call to LocalStack. Use it for enums and obvious mistakes.

**Locals** are for values you *derive* inside the module — a tag map, a prefixed name, a concatenated ARN. You do not pass them from the CLI. If you copy-pasted `Project = var.project` onto five resources, a sixth resource would miss a tag; `local.common_tags` is one map, reused. They are not inputs (that is `variable`) and not something you print for the outside world (that is `output`).

**Outputs** are the opposite direction: after `apply`, Terraform knows the real id/ARN/tags. A human or CI should not open `terraform.tfstate` to copy them. `terraform output bucket_name` (or a later module that reads this one) is the supported door. Lab 04 prints the tag map so you see that door; later, a Lambda will need the bucket name without hardcoding it.

```hcl
output "bucket_name" {
  value       = aws_s3_bucket.hello.id
  description = "Name to use in aws s3 ls"
}
```

```bash
terraform output bucket_name
```

## Secrets

`sensitive = true` on an output hides it from the terminal. It is **still in state**. Do not put production passwords in `.tfvars` that you commit. Secrets Manager (CLI owns the value, Terraform looks up the ARN) is in [`aws-intermediate`](../aws-intermediate/11-secrets-kms.md).

Workspaces (`terraform workspace new prod`) are another way to get two state files from one folder. For this course, **separate directories or `-var-file`** are clearer. Skip workspaces until a team forces them on you.

`lifecycle { prevent_destroy = true }` is a seatbelt on a resource you must not delete. You will not need it on lab buckets.

## Next

Take the hello-world project and split the hardcoded name into variables: [04-lab-state-and-variables.md](04-lab-state-and-variables.md).
