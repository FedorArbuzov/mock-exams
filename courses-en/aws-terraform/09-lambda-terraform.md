# 09. Lambda: zip, role, invoke

Lambda is **not** a VM you SSH into. You give AWS (here: LocalStack) a zip of code. Something happens (you click invoke). AWS starts a runtime, calls one function, and can freeze or throw the environment away. You pay for that burst, not for a server sitting idle.

Terraform’s job is only to **register** the function: name, runtime, zip bytes, and **which IAM role to wear**. Python actually runs at *invoke* time, not at `terraform apply`.

## Handler name

`handler = "handler.main"` is a dotted path:

- file `handler.py` (the `handler` part)
- function `def main(event, context):` (the `main` part)

Rename the file or the function and forget to change this string → runtime error “handler not found,” even if apply succeeded.

`event` is the JSON input (empty `{}` in the lab, later a filename). `context` is AWS metadata (request id, remaining time). You can ignore `context` at first.

## Why a zip, why `archive_file`

AWS wants a zip (or a container image — we stay on zip). You could zip by hand. `data "archive_file"` does it on every plan so Terraform always sees current files.

`data` is not a cloud object. It is Terraform computing something locally. `resource "aws_lambda_function"` is what LocalStack stores.

`path.module` is “the folder of this `.tf` file.” So `lambda/handler.py` next to `lambda.tf` resolves correctly.

`source_code_hash` is a fingerprint of the zip. **Without it**, you edit Python, run `apply`, and Terraform says `No changes` — it only looks at the filename, not the bytes. With the hash, a new zip → update the function.

## Why the role is required

`role = aws_iam_role.lambda_exec.arn` is the badge from lessons 09–10. The function does **not** use `AWS_ACCESS_KEY_ID` from your shell. If the role is missing, apply fails. Lab 10 already allowed `s3:PutObject`; the first handler still just returns JSON so you can see invoke work.

## The example

One file, no `pip` packages:

```hcl
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda/handler.py"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "hello" {
  function_name = "course-hello"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.main"
  runtime       = "python3.12"

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
}
```

**Invoke** is a separate API call (`lambda invoke`). Terraform does not run the function for you. First invoke on LocalStack can be slow: it may pull a Python image. That is normal, not a broken apply.

Add `archive` to the `required_providers` block in your existing `terraform { }` (same folder). Writing to S3 waits until the next lab. First you want: empty JSON in, `{"ok": true}` out.

## Next

Write the Python, apply, invoke: [10-lab-lambda-terraform.md](10-lab-lambda-terraform.md).
