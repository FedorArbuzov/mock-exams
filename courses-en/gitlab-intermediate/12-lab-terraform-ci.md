# 12. Lab: Terraform plan on an MR

## Real-world scenario

Infra changes without a plan in review are an expensive class of mistakes. The platform requires: a **green terraform plan** in the MR before merge. Apply is a separate button on protected `main`. You'll connect GitLab CI to [`image-pipeline`](../aws-terraform/projects/image-pipeline/) — the same Terraform code as in the aws-terraform course (S3, Lambda, DynamoDB).

**Preconditions:** [11-terraform-ci.md](11-terraform-ci.md), basic Terraform. AWS/LocalStack for apply is **not required** — a plan with `init -backend=false` is enough.

## What you'll do

- Import `image-pipeline` into GitLab (a separate project or a monorepo `infrastructure/`).
- Add `terraform-plan` and `terraform-apply` (manual) jobs.
- Open an MR with a `.tf` change and read the plan in the log.
- Download the `plan.cache` artifact.

---

## Task 1. The project in GitLab

The `image-pipeline-infra` project (or a subfolder in the app repository):

```text
infrastructure/
├── versions.tf
├── provider.tf
├── variables.tf
├── s3.tf
├── lambda.tf
├── dynamodb.tf
├── iam.tf
├── notification.tf
├── outputs.tf
└── lambda/
    ├── handler.py
    └── requirements.txt
```

Copy from [`aws-terraform/projects/image-pipeline`](../aws-terraform/projects/image-pipeline/).

`terraform.tfvars.example` → `terraform.tfvars` **locally**, in `.gitignore`. Secrets — CI variables only (`TF_VAR_*`).

---

## Task 2. The pipeline

```yaml
stages:
  - validate
  - deploy

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

.terraform-base:
  image:
    name: hashicorp/terraform:1.7
    entrypoint: [""]
  variables:
    TF_IN_AUTOMATION: "true"
    TF_INPUT: "false"
  tags: [docker]

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
    - if: $CI_COMMIT_BRANCH == "main"

terraform-apply:
  extends: .terraform-base
  stage: deploy
  needs:
    - job: terraform-plan
      artifacts: true
  script:
    - cd infrastructure
    - terraform init
    - terraform apply -auto-approve plan.cache
  when: manual
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

| Job | Backend | Apply? |
|-----|---------|--------|
| plan (MR) | `init -backend=false` | no |
| apply (main) | full `init` | manual |

A runner with the `docker` tag — from [`deploy/gitlab`](../../deploy/gitlab/README.md).

---

## Task 3. MR workflow

1. Branch `feature/add-s3-tag`.
2. In `s3.tf` add a tag:

```hcl
tags = {
  Project     = "image-pipeline"
  Managed     = "gitlab-ci-lab"
  Environment = "lab"
}
```

3. Push, MR into `main`.
4. The `terraform-plan` job — **passed**.
5. In the log — a `Plan:` block, N to add, 0 to change, 0 to destroy (or change).

The reviewer reads the plan **before** merge — a mirror of [aws-terraform/21-ci-terraform.md](../aws-terraform/21-ci-terraform.md).

---

## Task 4. The plan.cache artifact

**Job artifacts** in the pipeline UI — download `plan.cache`.

Locally:

```bash
cd infrastructure
terraform init -backend=false
terraform show plan.cache
```

Confirm the diff matches the job log.

---

## Task 5. Apply (only deliberately)

**Don't click** apply without LocalStack or a test AWS account.

With LocalStack per [aws-terraform/22-lab-ci-terraform.md](../aws-terraform/22-lab-ci-terraform.md):

```yaml
  variables:
    TF_VAR_use_localstack: "true"
```

Then a manual apply is safe in the learning environment.

---

## Task 6. (Bonus) include template

Extract `.terraform-base` and `terraform-plan` into `ci/terraform-plan.yml` ([10-lab-templates.md](10-lab-templates.md)):

```yaml
include:
  - local: ci/terraform-plan.yml
```

---

## Task 7. (Bonus) changes: filter

```yaml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - infrastructure/**/*
```

Terraform jobs don't run on an MR that changes only `app/` or the README.

---

## What went wrong

### `fmt -check` failed

**Fix:** `terraform fmt -recursive` locally; commit.

### `validate` failed

**Fix:** `terraform validate` locally; check `versions.tf` and the provider block.

### Plan skipped on the MR

**Cause:** `workflow:rules` or `changes:` too narrow.

**Fix:** temporarily remove `changes:` for debugging.

### Apply: no plan.cache

**Cause:** `needs` without `artifacts: true`; apply in a pipeline of a different SHA.

**Fix:** apply only in the main pipeline of the same commit as the plan.

### Provider AWS unreachable

**Expected** without credentials — use `TF_VAR_use_localstack` as in the image-pipeline README.

### State lock error on apply

**Cause:** parallel apply jobs.

**Fix:** `resource_group: terraform` in GitLab 15+.

---

## Summary

- Terraform CI mirrors app CI: plan on the MR, apply manual on main.
- `image-pipeline` — a real project from [`aws-terraform`](../aws-terraform/README.md).

---

## Success criteria

- [ ] `fmt -check`, `validate`, `plan` green on the MR
- [ ] A meaningful diff in the plan log
- [ ] The `plan.cache` artifact downloads
- [ ] `terraform-apply` manual only on `main`
- [ ] Apply wasn't run without a test backend

---

## Related material

| Next | Content |
|--------|------------|
| [13-final-project.md](13-final-project.md) | app + infra in one portfolio |
| [aws-terraform/21-22](../aws-terraform/21-ci-terraform.md) | the GitHub Actions variant |

Next lesson: [13-final-project.md](13-final-project.md).
