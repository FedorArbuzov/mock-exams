# 10. Lab: invoke a function

Goal: a function that exists in LocalStack **and** actually runs once. Apply without invoke only proves Terraform accepted the zip.

Same folder: **`~/aws-labs`**. The role from lab 08 must already be in this state.

> **Interactive check.** **Check** looks for Lambda **`course-hello`** (state Active). **Start lab** deletes that function (bucket and role stay). Skip **Cleanup**.

```bash
mkdir -p ~/aws-labs/lambda
cd ~/aws-labs
```

## Task 1. The Python

`lambda/handler.py` — the name `main` must match `handler = "handler.main"`:

```python
import json

def main(event, context):
    return {"statusCode": 200, "body": json.dumps({"ok": True, "event": event})}
```

`statusCode` / `body` is a common Lambda return shape. For a raw invoke, returning a dict is enough.

## Task 2. `lambda.tf`

Copy the `archive_file` + `aws_lambda_function` from [lesson 09](09-lambda-terraform.md). Add the `archive` provider next to `aws` in your `terraform { }` block if it is not there yet. `role` must be `aws_iam_role.lambda_exec.arn` — if `iam.tf` is missing, Terraform will error on a missing reference.

## Task 3. Apply, then invoke

```bash
terraform apply -var-file=dev.tfvars
```

Apply succeeds ≠ the function ran. Invoke it:

```bash
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name course-hello \
  --cli-binary-format raw-in-base64-out \
  --payload "{}" \
  response.json
```

`--cli-binary-format` is an AWS CLI v2 quirk so `"{}"` is sent as JSON, not base64. Open `response.json` and look for `"ok": true`. If the first call hangs, wait: LocalStack may still be pulling the runtime image.

If invoke fails with a role or handler error, read the message: wrong `handler` string and missing trust policy are the usual two.

## Success criteria

- [ ] UI Check is green for `course-hello`
- [ ] Invoke returns ok
- [ ] You can explain why a second apply after editing Python needs `source_code_hash`

Next: [11-s3-lambda-pipeline.md](11-s3-lambda-pipeline.md).
