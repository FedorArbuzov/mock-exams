# 10. Lab: IAM role for Lambda

Create `~/aws-labs/lesson-10` with LocalStack and a provider (endpoints or `tflocal`).

## Task 1. iam.tf

Copy the role + policy from [09-iam-terraform.md](09-iam-terraform.md), replacing the bucket/table references with stubs, or create the bucket/table beforehand.

The minimal option is a policy only for logs:

```hcl
resource "aws_iam_role" "lambda_exec" {
  name = "course-lab-10-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda_logs" {
  name = "course-lab-10-logs"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["logs:*"]
      Resource = "*"
    }]
  })
}
```

## Task 2. output role ARN

```hcl
output "lambda_role_arn" {
  value = aws_iam_role.lambda_exec.arn
}
```

## Task 3. apply and verification

```bash
tflocal apply
tflocal output lambda_role_arn
```

CLI:

```bash
aws --endpoint-url=http://localhost:4566 iam get-role --role-name course-lab-10-lambda
```

## Success criteria

- [ ] The role exists
- [ ] The trust policy contains `lambda.amazonaws.com`
- [ ] The inline policy is attached

Next lesson: [11-s3-terraform.md](11-s3-terraform.md).
