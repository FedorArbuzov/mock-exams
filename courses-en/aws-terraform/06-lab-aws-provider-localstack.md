# 06. Lab: endpoints for the rest of the course

**Prerequisite for IAM and Lambda.** Lab 02 only routed S3. Each of those services is a different AWS hostname; LocalStack serves them all on `:4566`. If the `provider` is missing `iam` or `lambda`, that call goes to real AWS (or hangs).

Same folder: **`~/aws-labs`**. You are not building a new stack — you are completing the provider this project will keep using.

## Task 1. Full `endpoints` map

Replace the `endpoints { s3 = ... }` block with the full map from [lesson 05](05-aws-provider-localstack.md). Keep `skip_*` and `test`/`test`.

## Task 2. Still applies

```bash
cd ~/aws-labs
terraform apply -var-file=dev.tfvars
```

(If you never did lab 04: `terraform apply` is enough.) The bucket should be `No changes` or already match state. You are proving S3 still works after the extra keys.

LocalStack must be up: `curl -s http://localhost:4566/_localstack/health`

## Success criteria

- [ ] `provider` lists s3, iam, sts, lambda (same URL)
- [ ] Apply did not try to talk to real AWS

Do not destroy. Next labs add files in this folder.

Next: [07-iam-terraform.md](07-iam-terraform.md).
