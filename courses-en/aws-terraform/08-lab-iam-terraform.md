# 08. Lab: IAM role in the same project

Goal: a role that **only Lambda** may assume, plus **`s3:PutObject`** on the bucket you already have. No function yet.

Same folder as labs 02–06: **`~/aws-labs`**. Do not start a new Terraform root.

> **Interactive check.** **Start lab** deletes leftover role `course-lambda-exec` (the bucket stays). After apply, **Check**. Skip **Cleanup** — you will keep growing this stack.

```bash
cd ~/aws-labs
```

Windows: `Set-Location "$HOME\aws-labs"`

## Before you paste — two JSONs, two jobs

You will paste **two** resources. Read them as two questions:

1. **`assume_role_policy`** (on `aws_iam_role`) — *who may wear this role?*  
   Action is **`sts:AssumeRole`**. STS = temporary keys. Lambda calls this when it starts. This line does **not** write to S3. Without it the function will not start.

2. **`aws_iam_role_policy`** — *what may it do once it is wearing the role?*  
   Action is **`s3:PutObject`** on `${aws_s3_bucket.hello.arn}/*`. That is the write to the bucket.

If you mix them up (PutObject in trust, or AssumeRole in the S3 policy), either Lambda cannot start or `put_object` is denied.

## Task 1. `iam.tf`

Paste both resources from [lesson 07](07-iam-terraform.md). Keep the role name **`course-lambda-exec`**. The S3 policy must reference `aws_s3_bucket.hello` — that resource is already in `main.tf`.

## Task 2. Apply

```bash
terraform apply -var-file=dev.tfvars
terraform state list
```

You want `aws_iam_role.lambda_exec` and `aws_iam_role_policy.lambda_s3` **and** the bucket from lab 04.

Optional — this is the **trust** document AWS stored:

```bash
aws --endpoint-url=http://localhost:4566 iam get-role --role-name course-lambda-exec
```

In `AssumeRolePolicyDocument` you should see `lambda.amazonaws.com` and `sts:AssumeRole`, not an IAM user and not `s3:PutObject`.

## Success criteria

- [ ] UI Check is green (`course-lambda-exec`)
- [ ] You can point at which JSON is “Lambda may wear this” vs “this may write to the bucket”
- [ ] You can explain in one sentence what would break if trust said `*` or a human user

Next: [09-lambda-terraform.md](09-lambda-terraform.md) — still this folder.
