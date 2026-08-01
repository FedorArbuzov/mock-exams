# 24. How we verify

Grading uses **LocalStack probes** + a human rubric. No Kubernetes.

---

## Layer 1 — Automated checks

From the **mock-exams** root (LocalStack up, stack applied):

```bash
mockctl localstack status

# from your project dir after apply:
BUCKET=$(tflocal output -raw bucket_name)            # or images_bucket
TABLE=$(tflocal output -raw dynamodb_table_name)
LAMBDA=$(tflocal output -raw lambda_function_name)   # resize function
DLQ=$(tflocal output -raw dlq_url)                   # optional name — see flags
API=$(tflocal output -raw api_endpoint)              # optional

cd /path/to/mock-exams
./courses-en/aws-terraform/scripts/verify-final.sh \
  --platform \
  --bucket "$BUCKET" \
  --table "$TABLE" \
  --lambda "$LAMBDA" \
  --dlq-name "${DLQ_NAME:-}" \
  --secret-name "${SECRET_NAME:-}" \
  --api-url "${API:-}" \
  --upload path/to/test.jpg
```

Minimum smoke (core starter only): omit `--platform` and pass `--bucket`, `--table`, `--lambda`.

**Platform finale (Must #17)** requires `--platform` plus:

| Flag | Checks |
|---|---|
| (implied) | DynamoDB GSI + TTL; Lambda `DeadLetterConfig` |
| `--dlq-name` | SQS queue exists |
| `--secret-name` | Secrets Manager secret exists |
| `--api-url` | HTTP GET `/health` returns 2xx |
| `--upload` | after upload: `thumbs/` non-empty and DynamoDB Count ≥ 1 |

If an output name differs, pass explicit values. Exit `0` = Layer 1 PASS.

---

## Layer 2 — Human rubric

Tick Must rows **1–17** in [23-final-project.md](23-final-project.md) and ≥3 Bonus items if claimed.

Focus:

1. Modules + `for_each`/`count` visible in `terraform state list`  
2. IAM not star-star  
3. DLQ + Secrets + API present in state  
4. No secrets in Git  
5. README / architecture docs  

---

## Layer 3 — Student self-check

```bash
mockctl localstack status
aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 dynamodb list-tables
aws --endpoint-url=http://localhost:4566 lambda list-functions
aws --endpoint-url=http://localhost:4566 sqs list-queues
aws --endpoint-url=http://localhost:4566 secretsmanager list-secrets
```

Cleanup:

```bash
tflocal destroy
mockctl localstack down
```

---

## What we do not auto-test

| Item | Why |
|---|---|
| Least-privilege quality | Policy review |
| Backend init details | Mentor / docs |
| EventBridge / SNS bonuses | Optional flags later |
| Real AWS | Out of scope |

---

## Suggested grading

| Part | Weight |
|---|---|
| Layer 1 (`verify-final.sh` with platform flags) | 35% |
| Must AWS + Terraform rubric | 45% |
| Docs + demo | 20% |
| Bonus | extra |
