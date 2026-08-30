# 12. Lab: invoke and see the object

Still **`~/aws-labs`**. Check looks for:

| Resource | Name |
|---|---|
| S3 bucket | `course-lab-hello-dev` |
| IAM role | `course-lambda-exec` |
| Lambda | `course-hello` |

> **Interactive check.** **Start lab** does **not** delete your bucket. After apply, press **Check**. Skip **Cleanup** until you are done.

```bash
cd ~/aws-labs
```

## Task 1. Env

On `aws_lambda_function.hello`:

```hcl
environment {
  variables = {
    BUCKET_NAME = aws_s3_bucket.hello.id
  }
}
```

Lab 08 already has `s3:PutObject` on the hello bucket.

## Task 2. handler.py

Replace the hello handler with one that `put_object`s under `files/` in `BUCKET_NAME`. You can copy [`projects/image-pipeline/lambda/handler.py`](projects/image-pipeline/lambda/handler.py). Keep `source_code_hash` so apply updates the zip.

## Task 3. Apply and invoke

Add outputs if you do not have them yet:

```hcl
output "bucket_name" {
  value = aws_s3_bucket.hello.id
}

output "lambda_function_name" {
  value = aws_lambda_function.hello.function_name
}
```

```bash
terraform apply -var-file=dev.tfvars
```

```bash
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name course-hello \
  --cli-binary-format raw-in-base64-out \
  --payload "{\"filename\":\"e2e.txt\"}" \
  response.json

aws --endpoint-url=http://localhost:4566 s3 ls s3://course-lab-hello-dev/files/
```

AWS CLI **v1** (pip): drop `--cli-binary-format raw-in-base64-out`.

**What you'll see:** `e2e.txt` (or similar) under `files/`, `response.json` with `ok`.

## Task 4. Debugging

If invoke returns 200 but S3 is empty: IAM `PutObject`, env `BUCKET_NAME`, or Lambda cannot reach LocalStack (`AWS_ENDPOINT_URL`).

## Success criteria

- [ ] UI Check is green (bucket, role, function)
- [ ] After invoke, `files/` has an object

Next: [13-next-steps.md](13-next-steps.md).
