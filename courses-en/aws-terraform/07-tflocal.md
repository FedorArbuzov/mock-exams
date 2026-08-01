# 07. tflocal: one codebase for local and prod

## The problem

In `.tf` files you don't want to duplicate the `endpoints { ... }` block and `skip_*` — they must not exist in production.

## Solution: terraform-local

The **[terraform-local](https://github.com/localstack/terraform-local)** package installs the **`tflocal`** CLI, which:

1. Wraps the `terraform` call.
2. Injects environment variables and a **generated** `localstack_providers_override.tf` with endpoints.
3. Your `.tf` files stay "clean" for AWS.

```bash
pip install terraform-local
```

## Usage

```bash
# LocalStack must be running
tflocal init
tflocal plan
tflocal apply
tflocal destroy
```

Equivalent to `terraform` with auto-configuration for `http://localhost:4566`.

## Provider without endpoints in the repository

For a course using `tflocal`, this is enough:

```hcl
provider "aws" {
  region = var.aws_region
}
```

`tflocal` adds the override at runtime.

For **real AWS**:

```bash
export AWS_PROFILE=dev
terraform apply
```

## Comparison of approaches

| Approach | When |
|---|---|
| `endpoints` in provider | Explicit control, MiniStack, CI without tflocal |
| `tflocal` | Quick labs, less boilerplate |
| `use_localstack` variable | One repository, switching via tfvars |

In this course we use **both**: you understand endpoints (lessons 05–06) and `tflocal` (lessons 07–08).

## .gitignore

```
.terraform/
*.tfstate
*.tfstate.*
.terraform.lock.hcl
localstack_providers_override.tf
```

The last file is created by `tflocal` — don't commit it.

## Checklist

- What does `tflocal` do under the hood?
- Why is the override file in `.gitignore`?
- How do you apply the same code in prod without tflocal?

Next lesson: [08-lab-tflocal.md](08-lab-tflocal.md).
