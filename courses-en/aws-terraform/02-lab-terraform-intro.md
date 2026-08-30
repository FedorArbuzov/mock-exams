# 02. Lab: Hello Terraform

Lesson 01 was the map. Now you type one `main.tf` and run `apply` against the LocalStack you already started in [ENVIRONMENT.md](ENVIRONMENT.md). One bucket. You **keep** this project and grow it. Variables come next.

> **Interactive check.** Open this lesson in the courses UI (http://127.0.0.1:8091/). **Start lab** deletes a leftover bucket named `nimbus-tf-hello`. Apply the tasks, press **Check** (that bucket must still exist). Skip **Cleanup** and do **not** `destroy` — lab 04 uses this folder.

## Prep

```bash
terraform version   # >= 1.5
curl -s http://localhost:4566/_localstack/health
mkdir -p ~/aws-labs
cd ~/aws-labs
```

Windows PowerShell:

```powershell
terraform version
Invoke-WebRequest http://localhost:4566/_localstack/health -UseBasicParsing
New-Item -ItemType Directory -Force "$HOME\aws-labs" | Out-Null
Set-Location "$HOME\aws-labs"
```

If `terraform` is not found, install it in [01-terraform-intro.md](01-terraform-intro.md) and open a new terminal.

If health fails, start LocalStack (ENVIRONMENT.md) and retry.

## Task 1. `main.tf`

Create **one** file. Paste the `terraform` / `provider` blocks as-is (they point at LocalStack). Then add a bucket resource — and **change the S3 name**. Check does not accept the placeholder in the snippet.

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Talks to LocalStack, not real AWS. Lesson 05 explains the skip_* flags.
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    s3 = "http://localhost:4566"
  }
}

resource "aws_s3_bucket" "hello" {
  bucket = "example-bucket"
}
```

### What those lines are

A Terraform file is not a script. It is a list of objects. Three kinds of block:

| Block | Job in this file |
|---|---|
| `terraform { }` | Which Terraform version, which plugins. `init` reads this and downloads `hashicorp/aws`. |
| `provider "aws" { }` | How to talk to AWS. Here: fake keys, skip real-AWS checks, send S3 to `localhost:4566` (LocalStack). |
| `resource` | One thing to create. |

The resource line is three separate names. Mixing them up is the usual first-lab mistake.

```hcl
resource "aws_s3_bucket" "hello" {
  bucket = "example-bucket"
}
```

- **`resource`** — “create and manage this.”
- **`"aws_s3_bucket"`** — **type**. The AWS provider’s name for an S3 bucket. You do not invent this string; it is in the provider docs. After `apply`, LocalStack (pretending to be AWS) actually has a bucket.
- **`"hello"`** — **local name** inside *this* project. Terraform’s address becomes `aws_s3_bucket.hello` (`terraform state list` prints that). You could call it `box` or `images`; Check does **not** look at this word.
- **`bucket = "..."`** — argument: the **real S3 name** (the one `aws s3 ls` shows). In real AWS this name is global. LocalStack is a single fake account, but the same field still has to be set.

`example-bucket` in the snippet is a dummy. Check looks in LocalStack for a bucket named **`nimbus-tf-hello`**. Put that string in `bucket =`, then `apply`. Leaving the placeholder (or renaming only `"hello"`) fails Check.

## Task 2. Run it

```bash
terraform init
terraform plan
terraform apply
```

Confirm with `yes` (or pass `-auto-approve`).

**What you'll see:** `Plan: 1 to add`, then Apply complete.

Check that Terraform remembered the bucket:

```bash
terraform state list
```

You should see `aws_s3_bucket.hello` (the local name). The S3 name lives inside that resource, not in the address.

Same bucket via [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) (install in [ENVIRONMENT.md](ENVIRONMENT.md) — Check uses `aws` too). `--endpoint-url` sends the call to **LocalStack**, not real AWS (`test`/`test` are dummy keys LocalStack accepts):

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
aws --endpoint-url=http://localhost:4566 s3 ls
```

You should see `nimbus-tf-hello` in the list.

## Task 3. Check, then keep the stack

In the UI, press **Check**. After it passes, **do not destroy**. You will rename the bucket with variables in lab 04.

Leave LocalStack running.

## Success criteria

- [ ] `terraform init` downloaded the AWS provider
- [ ] `apply` created **`nimbus-tf-hello`** (UI Check is green; `s3 ls` shows that name)
- [ ] The folder `~/aws-labs` still has state — you will add files here

## Common mistakes

| Error | Fix |
|---|---|
| `connection refused :4566` | LocalStack is down — see ENVIRONMENT.md |
| Check red, `s3 ls` shows `example-bucket` | You pasted the snippet as-is. Set `bucket = "nimbus-tf-hello"` and `apply` again |
| Check red, state has `aws_s3_bucket.nimbus-tf-hello` | You renamed the local name. Check wants the **S3** name (`bucket =`), not the label after the type |
| `BucketAlreadyExists` | Leftover from a previous try — UI **Start lab** or destroy first |
| Auth / credentials error | Keep `access_key = "test"` and the `skip_*` flags |

Next lesson: [03-state-and-variables.md](03-state-and-variables.md).
