# 13. What we learned / what's next

You already built the whole story in **`~/aws-labs`**: a bucket, a role, a function that writes a file. There is no second project. This page is the pause after lab 12.

## What you can do now

- Write Terraform for **S3, IAM, and Lambda** and apply it against LocalStack.
- Explain **plan vs apply**, **state**, and why **variables / outputs** exist.
- Point `provider` **`endpoints`** at LocalStack so IAM and Lambda do not hit real AWS.
- Split IAM into two documents: **trust** (`sts:AssumeRole` for `lambda.amazonaws.com`) vs **permissions** (`s3:PutObject` on `bucket/*`).
- Zip Python with `archive_file`, invoke the function, and **see an object in S3** that Terraform did not upload.

That is the one-day win.

## What was left out on purpose

These live in [`aws-intermediate`](../aws-intermediate/README.md):

| Topic | Why not here |
|-------|----------------|
| DynamoDB, SQS, API Gateway, EventBridge | extra services after the first file-writer |
| Secrets, KMS | a different threat model |
| Modules | you need one working root first |
| Terraform in CI | [`gitlab-intermediate`](../gitlab-intermediate/README.md) uses the same `image-pipeline` starter |
| Real AWS account | LocalStack first; then a **dev** account + a Budgets alert |

## What's next

1. **[`aws-intermediate`](../aws-intermediate/README.md)** — DynamoDB, secrets, modules, CI, VPC, APIs, queues.
2. Optional: copy [`projects/image-pipeline/`](projects/image-pipeline/) if you want a clean tree instead of `~/aws-labs`.
3. Later: a real AWS account, remote state (S3 + lock), Terraform Cloud.

Optional LocalStack probe (not a second lab):

```bash
cd ~/aws-labs
BUCKET=$(terraform output -raw bucket_name)
LAMBDA=$(terraform output -raw lambda_function_name)
# from the mock-exams repo:
./courses-en/aws-terraform/scripts/verify-final.sh \
  --bucket "$BUCKET" --lambda "$LAMBDA" --invoke
```

When you are done with the stand:

```bash
cd ~/aws-labs
terraform destroy -var-file=dev.tfvars
```

---

**aws-terraform is complete.** Continue with [`aws-intermediate`](../aws-intermediate/README.md).
