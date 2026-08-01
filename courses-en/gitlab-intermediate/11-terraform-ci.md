# 11. Terraform in GitLab CI

## Real-world scenario

An MR changes the `aws_s3_bucket` ACL. The reviewer didn't notice. Apply on merge — and the data is public. Post-mortem: "we need a **plan in the MR**." Second case: `terraform apply` on every push to main without approval — state drift. Third: a 4000-line plan — nobody reads it. Intermediate: **fmt → validate → plan (artifact)** on the MR; **apply manual** on protected `main` — a mirror of [aws-terraform/21-ci-terraform.md](../aws-terraform/21-ci-terraform.md).

Code: [`aws-terraform/projects/image-pipeline`](../aws-terraform/projects/image-pipeline/).

## What you'll learn

- The goals of CI for IaC (no apply on every PR).
- The `terraform fmt`, `validate`, `plan`, `apply` jobs.
- The **`plan.cache`** artifact and `terraform apply plan.cache`.
- `TF_IN_AUTOMATION`, `init -backend=false` in the MR.
- LocalStack / tflocal for a learning plan.

---

## The IaC pipeline pattern

```text
MR opened / updated
    │
    ▼
┌─────────────┐   ┌──────────┐   ┌─────────────────────┐
│ fmt -check  │──▶│ validate │──▶│ plan → plan.cache   │
└─────────────┘   └──────────┘   │ (artifact, review)  │
                                 └─────────────────────┘

merge to main (protected)
    │
    ▼
┌─────────────┐   ┌──────────────────────────┐
│ init backend│──▶│ apply plan.cache (manual)│
└─────────────┘   └──────────────────────────┘
```

**Don't apply on every MR** to a shared account without human review.

---

## The plan job (MR)

```yaml
.terraform-base:
  image:
    name: hashicorp/terraform:1.7
    entrypoint: [""]
  variables:
    TF_IN_AUTOMATION: "true"
    TF_INPUT: "false"

terraform-plan:
  extends: .terraform-base
  stage: validate
  script:
    - cd infrastructure
    - terraform init -backend=false
    - terraform fmt -check -recursive
    - terraform validate
    - terraform plan -out=plan.cache
  artifacts:
    paths:
      - infrastructure/plan.cache
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - infrastructure/**/*
```

| Step | Why |
|-----|-------|
| `fmt -check` | CI fails on unformatted code |
| `init -backend=false` | the MR doesn't write to remote state |
| `plan -out` | a deterministic apply later |
| `artifacts` | apply downloads the same plan |
| `changes:` | don't run terraform on a UI-only MR |

The `image-pipeline` project describes an S3 → Lambda → DynamoDB pipeline ([README](../aws-terraform/projects/image-pipeline/README.md)).

---

## The apply job (manual, main)

```yaml
terraform-apply:
  extends: .terraform-base
  stage: deploy
  needs:
    - job: terraform-plan
      artifacts: true
      optional: true
  script:
    - cd infrastructure
    - terraform init
    - terraform apply -auto-approve plan.cache
  when: manual
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - infrastructure/**/*
```

On main the plan job may duplicate under other rules.

**Learning warning:** without LocalStack/AWS, **don't click apply** — plan only.

---

## LocalStack in CI (optional)

Per [aws-terraform/22-lab-ci-terraform.md](../aws-terraform/22-lab-ci-terraform.md):

```yaml
terraform-plan-localstack:
  extends: .terraform-base
  services:
    - name: localstack/localstack:latest
      alias: localstack
  variables:
    TF_VAR_use_localstack: "true"
    TF_VAR_localstack_endpoint: http://localstack:4566
    AWS_ACCESS_KEY_ID: test
    AWS_SECRET_ACCESS_KEY: test
    AWS_DEFAULT_REGION: us-east-1
  script:
    - cd infrastructure
    - terraform init -backend=false
    - terraform validate
    - terraform plan -input=false
```

---

## Secrets and AWS auth

| Approach | Course |
|--------|------|
| Static keys in variables | LocalStack only |
| `TF_VAR_*` | parameters without committing |
| OIDC → IAM role | [`gitlab-advanced`](../gitlab-advanced/README.md) |

Don't commit `*.tfvars` with secrets.

---

## Policy as Code (overview)

```yaml
tfsec:
  stage: validate
  image: aquasec/tfsec:latest
  script:
    - tfsec infrastructure/
  allow_failure: true
```

---

## Connection to the application pipeline

```text
app repo:     lint → docker → deploy k8s (mockctl)
infra repo:   terraform plan → (manual) apply
```

Application deploy — [`mockctl`](../../mockctl/README.md); infra — [`aws-terraform`](../aws-terraform/README.md).

---

## Common mistakes

**Apply without a plan artifact** — drift.

**Plan in the MR with a backend write** — state lock races.

**No `fmt -check`** — noise in review.

**Parallel apply** — `resource_group` in GitLab 15+.

**Secrets in the plan log** — `sensitive = true`.

---

## Summary

- MR: fmt + validate + plan artifact; main: manual apply of the same plan.
- `init -backend=false` on the MR — don't touch remote state.
- `image-pipeline` — the reference Terraform code for lab 12.

---

## Related material

| Material | Relation |
|----------|-------|
| [12-lab-terraform-ci.md](12-lab-terraform-ci.md) | image-pipeline lab |
| [aws-terraform/21](../aws-terraform/21-ci-terraform.md) | the GitHub Actions equivalent |
| [09-ci-templates.md](09-ci-templates.md) | `.terraform-base` |

---

## Checklist

- [ ] Why a plan artifact
- [ ] Why apply is manual on main
- [ ] `init -backend=false` in the MR
- [ ] `TF_IN_AUTOMATION`
- [ ] fmt in CI is mandatory

Next lesson: [12-lab-terraform-ci.md](12-lab-terraform-ci.md).
