# 23. Final project: Image Platform (Terraform + AWS)

## What it is today (old baseline)

The repo still has a **minimal** reference: [`projects/image-pipeline/`](projects/image-pipeline/) — S3 upload → Lambda resize → DynamoDB. That is the **core path**, not the full bar anymore.

## Goal (this finale)

Build an **image platform** on LocalStack with Terraform: event-driven processing, queues, API, secrets, modules, and CI-friendly layout — something you can defend in an interview as “how I’d structure real IaC.”

**Stand:** `mockctl localstack up` (no Kubernetes).  
**Time:** ~6–10 hours.  
**No single paste-ready solution for the whole platform** — use the course labs + extend `image-pipeline` yourself.  
**Verify:** [24-verification.md](24-verification.md).

---

## Target architecture

```text
                    ┌──────────────┐
   client ──PUT──►  │ API Gateway  │──► Lambda (presign / health)
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐     ObjectCreated
                    │ S3 uploads/  │────────────────────┐
                    │ (+ KMS SSE)  │                    │
                    └──────────────┘                    ▼
                                              ┌─────────────────┐
                                              │ Lambda resize   │
                                              │ (reserved conc. │
                                              │  optional)      │
                                              └────────┬────────┘
                           ┌───────────┬───────────────┼───────────────┐
                           ▼           ▼               ▼               ▼
                     S3 thumbs/   DynamoDB        SQS DLQ          CW Logs
                     (SSE)        (+GSI/TTL)      (on fail)        (+ metric
                                                                  filter / alarm*)

                    Secrets Manager ──► Lambda env (DB table name / API token)
                    SNS topic ◄── Lambda success notification (optional fan-out)
                    EventBridge rule ──► (optional) scheduled cleanup Lambda

* alarms: best-effort on LocalStack; document if unsupported
```

| Contour | Purpose |
|---|---|
| `uploads/` | inbound originals |
| `thumbs/` | processed objects |
| DynamoDB | metadata (`image_id`, size, status, created_at) |
| SQS DLQ | failed invocations |
| API Gateway | `GET /health`, `POST /upload-url` (presigned PUT) |
| Secrets Manager | non-plaintext config for Lambdas |

---

## Stand & workflow

```bash
# mock-exams root
mockctl localstack up

cd courses-en/aws-terraform/projects/image-pipeline   # or your fork
# build zips, tflocal init/plan/apply …

./courses-en/aws-terraform/scripts/verify-final.sh …  # see lesson 24
```

Use `tflocal` (or provider endpoints) so the **same** root module can flip `use_localstack = false` for real AWS later.

---

## Must rubric — AWS

| # | Criterion |
|---|---|
| 1 | **S3** bucket(s): versioning **or** lifecycle rule; **SSE** (AES256 or KMS); block public access; separate prefixes `uploads/` / `thumbs/` |
| 2 | **S3 → Lambda** notification filtered to `uploads/` + `.jpg`/`.jpeg` + `aws_lambda_permission` |
| 3 | **Lambda** resize (Python 3.12): env from TF; writes thumb + DynamoDB item; CloudWatch log group with retention |
| 4 | **DynamoDB** on-demand; PK `image_id`; **TTL** attribute; **GSI** (e.g. `status` + `created_at`) |
| 5 | **IAM** least privilege (no `Action = "*"` on `Resource = "*"` for app roles) |
| 6 | **SQS DLQ** attached to resize Lambda (`dead_letter_config` / redrive); IAM send permission |
| 7 | **Secrets Manager** secret; Lambda reads secret name via env / IAM `GetSecretValue` (not plaintext password in tfvars committed) |
| 8 | **API Gateway** (HTTP API or REST) with at least: `GET /health` → Lambda; `POST /upload-url` → Lambda returning presigned PUT URL |
| 9 | End-to-end: upload via API or CLI → thumb appears → DynamoDB row → DLQ empty on success |

## Must rubric — Terraform craft

| # | Criterion |
|---|---|
| 10 | Root module + **≥2 local modules** (e.g. `modules/s3_bucket`, `modules/lambda_fn`) with inputs/outputs |
| 11 | `variables.tf` / `outputs.tf` / `locals`; **sensitive** outputs where needed |
| 12 | **`for_each` or `count`** used meaningfully (e.g. multiple Lambda env maps, two buckets, tags) |
| 13 | Provider **version constraints** + Terraform `required_version`; `use_localstack` switch |
| 14 | Remote-style **S3 backend** for state on LocalStack **or** documented why local state + `backend "s3"` config for prod (init with `-backend-config`) |
| 15 | `terraform fmt` + `validate` clean; README: plan / apply / destroy / test |
| 16 | Tagging strategy via `default_tags` or `locals.tags` on all taggable resources |
| 17 | [24-verification](24-verification.md) Layer 1 with **`--platform`** PASS |

## Bonus (pick ≥3)

| # | Idea |
|---|---|
| B1 | **SNS** publish on successful process |
| B2 | **EventBridge** schedule → cleanup Lambda (delete old thumbs / mark DynamoDB) |
| B3 | **KMS** CMK for S3 SSE-KMS + decrypt grants for Lambda |
| B4 | Lambda **alias** + `publish = true` / versioning story |
| B5 | **SSM Parameter Store** alongside or instead of one secret |
| B6 | Second workspace / `tfvars` (`dev` vs `staging` namespacing) |
| B7 | `check` blocks (TF ≥ 1.5) or `precondition` on resources |
| B8 | CI: `terraform fmt -check`, `validate`, `plan` (GitHub Actions or GitLab + `mockctl up --gitlab`) |
| B9 | Presigned **download** URL endpoint |
| B10 | CloudWatch **metric filter + alarm** on Lambda errors (document LocalStack gaps) |
| B11 | `moved` / refactor commit showing module extraction without destroy |
| B12 | Data source usage (`aws_caller_identity`, `aws_region`, …) |

---

## Hard fails

- Secrets / real AWS keys committed to Git  
- Console-only setup (no Terraform for core path)  
- `AdministratorAccess`-style policies on Lambda role  
- Only the old 3-resource pipeline with **none** of: DLQ, API, Secrets, modules, GSI/TTL  
- `verify-final.sh` Layer 1 fails  

---

## Recommended tree

```text
image-platform/
├── versions.tf
├── providers.tf
├── backend.tf                 # s3 backend (LocalStack or partial)
├── variables.tf
├── locals.tf
├── main.tf                    # thin — module calls
├── outputs.tf
├── terraform.tfvars.example
├── modules/
│   ├── s3_bucket/
│   └── lambda_function/
├── lambda/
│   ├── resize/
│   └── api/
├── scripts/
│   ├── build-lambdas.sh
│   └── smoke-upload.sh
└── docs/
    ├── architecture.md
    └── localstack-gaps.md     # what you couldn’t enable
```

Starter code (core only): [`projects/image-pipeline/`](projects/image-pipeline/).

---

## Demo script (10–12 min)

1. `mockctl localstack status`  
2. `tflocal plan` — show modules in graph  
3. `GET /health` via API Gateway URL from outputs  
4. `POST /upload-url` → `curl -X PUT` JPEG to presigned URL  
5. Show `thumbs/` + DynamoDB item + empty DLQ  
6. Force a failure (optional) → message in DLQ  
7. `terraform state list` — modules visible  
8. One bonus feature  

---

## Moving to real AWS

1. `use_localstack = false`; real backend bucket + lock table (or Terraform Cloud).  
2. Unique global bucket names; KMS keys in your account.  
3. Budget alert $5–10.  
4. Re-test IAM (LocalStack is permissive about some edge cases).

## Next

[24 — How we verify](24-verification.md)
