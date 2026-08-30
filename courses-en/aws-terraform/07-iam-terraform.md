# 07. IAM: the role Lambda will assume

Picture the platform: you invoke a small Python function. It writes a file to **the bucket you already created**. The function is **Lambda**. This lesson is not the function yet. It is the **badge** the function will wear.

You add `iam.tf` to the **same** project (`~/aws-labs`). The bucket `aws_s3_bucket.hello` is already in state.

## Your laptop vs a Lambda

On your machine, Terraform talks to LocalStack with `access_key = "test"`. That is *you* presenting keys.

Lambda is different. There is no person at a keyboard inside AWS. The runtime starts a container, runs `main(event, context)`, and stops. It still needs permission to call S3. AWS’s answer: **attach an IAM role**. While the function runs, it *borrows* that role. No password in the Python file.

Terraform must create the role **before** the function (next lessons). If you create the function first with a missing role ARN, apply fails. A role with no function yet is fine.

## STS

**STS** (Security Token Service) is the AWS service that hands out **temporary** credentials. You do not create an “STS resource” in this course. You do not write files with STS.

When Lambda starts your function it calls **`sts:AssumeRole`**: “I am the Lambda service. Give me short-lived keys for *this* role.” For a few seconds the function *is* that role. Then the keys expire.

That call is allowed or denied by the **trust policy** on the role. If trust does not allow Lambda, the function never starts — even if the permissions JSON is perfect and S3 is wide open.

## Two JSON documents (they look alike, they mean opposite things)

| | Trust (`assume_role_policy`) | Permissions (`aws_iam_role_policy`) |
|---|---|---|
| Question | *Who may put this badge on?* | *Once the badge is on, which APIs?* |
| Action in this lab | `sts:AssumeRole` | `s3:PutObject` |
| Principal / resource | Principal = `lambda.amazonaws.com` | Resource = `bucket-arn/*` |
| If you omit it | Function does not start | Function starts, `put_object` is `AccessDenied` |
| Writes a file? | **No** | **Yes** |

Hotel: trust = “only hotel staff may take this master key off the hook.” Permissions = “this key opens room 12.”

### Trust — who may assume

```json
{
  "Effect": "Allow",
  "Principal": { "Service": "lambda.amazonaws.com" },
  "Action": "sts:AssumeRole"
}
```

- **Principal** — *who* may ask. Here: the Lambda **service**, not you, not `*`.
- **Action** — *what* they may ask for. Only `sts:AssumeRole` (“wear the badge”). Not `s3:PutObject`.

If Principal is *your* IAM user, Lambda cannot start. If Principal is `*`, anyone in the account can pretend to be this role.

### Permissions — what the function may do after that

```json
{
  "Effect": "Allow",
  "Action": ["s3:PutObject"],
  "Resource": "arn:...:bucket/course-lab-hello-dev/*"
}
```

`PutObject` is “write one object.” The resource must be the **object** ARN (`…bucket-name/*`), not only the bucket ARN. Terraform interpolates `${aws_s3_bucket.hello.arn}/*` so you do not hardcode the name twice.

`jsonencode({ ... })` is there because Terraform is HCL and AWS IAM wants a JSON string.

Do **not** attach `AdministratorAccess` “to make it work.”

## The example

Both documents. Two Terraform resources, one role:

```hcl
resource "aws_iam_role" "lambda_exec" {
  name = "course-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_s3" {
  name = "course-lambda-s3"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.hello.arn}/*"
    }]
  })
}
```

The handler in lab 12 will call `PutObject`. That is the whole app for this course.

## Next

Add this to the project: [08-lab-iam-terraform.md](08-lab-iam-terraform.md).
