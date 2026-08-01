# 21. CI: Terraform in GitHub Actions

## CI goals for IaC

| Job | Command | Why |
|---|---|---|
| Format | `terraform fmt -check` | Consistent style |
| Validate | `terraform validate` | Syntax |
| Plan | `terraform plan` | Review diff in PR |
| Apply | `terraform apply` | Only protected branch + approval |

**Don't apply on every PR** to a shared account without review.

## Minimal workflow

```yaml
name: terraform

on:
  pull_request:
    paths:
      - "courses/aws-terraform/projects/**"
      - ".github/workflows/terraform-aws.yml"

jobs:
  plan:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: courses/aws-terraform/projects/image-pipeline
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - name: Init
        run: terraform init -backend=false

      - name: Format
        run: terraform fmt -check -recursive

      - name: Validate
        run: terraform validate

      - name: Plan (no backend)
        run: terraform plan -input=false
        env:
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_DEFAULT_REGION: us-east-1
```

For **plan against LocalStack** in CI — use a LocalStack service container (see lab 22).

## Secrets

- `AWS_ROLE_ARN` + OIDC — no long-lived keys.
- `TF_VAR_*` — don't commit secrets.

## terraform plan in a PR

A comment with the plan: `terraform plan | tfnotify` or built-in GitHub Actions (Atlantis, OpenTofu with equivalents).

## Policy as Code (mention)

**OPA / Sentinel / tfsec / checkov** — scan `.tf` for public buckets and open SGs. For the security course — a separate topic.

## Checklist

- Why `fmt -check` in CI?
- Why `init -backend=false` in a PR?
- Why apply only from main with approval?

Next lesson: [22-lab-ci-terraform.md](22-lab-ci-terraform.md).
