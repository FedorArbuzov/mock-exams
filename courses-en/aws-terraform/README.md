# AWS + Terraform

Hands-on **Infrastructure as Code** for AWS. One day, one project: a bucket on **LocalStack**, then an IAM role, then a Lambda that **writes a file into that bucket**. No paid AWS account, **no Kubernetes**.

**Time:** ~5–7 hours (theory + labs). You should finish in a day.  
**Prerequisites:** [`aws-basic`](../aws-basic/README.md) (AWS theory).

> Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · LocalStack one-liner: [mockctl-setup/LOCALSTACK.md](https://github.com/FedorArbuzov/mockctl-setup/blob/main/LOCALSTACK.md).

Open this course in the UI: **http://127.0.0.1:8091/aws-terraform/README.md**

---

## How to take this course

1. **ENVIRONMENT.md** once (Docker + LocalStack + Terraform).
2. Each **theory** page is a short story, not a cheat sheet — read it, then do the lab.
3. Work in **one folder** `~/aws-labs` (create it in lab 02). Every later lab adds files there. Skip **Cleanup** between labs.
4. **Interactive Check** (same panel as Kubernetes labs): lessons with a sibling `*.lab.json` — 02, 04, 08, 10, 12. LocalStack must be up; Check talks to it via AWS CLI (`:4566`).

---

## Local stand

| Component | How | URL / note |
|-----------|-----|------------|
| Courses UI | QUICKSTART / mockctl-setup | http://127.0.0.1:8091/ |
| LocalStack + lab | one-liner below | http://localhost:4566 · `exec lab bash` |
| Terraform / AWS CLI | inside `lab` (or host) | `~/aws-labs` |
| Kubernetes | **not required** | — |

Start the stand (LocalStack **and** Terraform/AWS CLI in `lab`):

**Windows:**

```powershell
irm https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/windows-localstack-up.ps1 | iex
```

**macOS / Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/unix-localstack-up.sh | bash
```

---

## Curriculum

The LocalStack block is **not** a second beginning. You already applied in lab 02; lessons 05–06 complete `endpoints` in the **same** provider. Then IAM and Lambda in that folder.

### First apply

1. [Terraform: what it is, install, plan/apply](01-terraform-intro.md)
2. [Lab: Hello Terraform](02-lab-terraform-intro.md) — one bucket, for real

### Terraform itself

3. [State, variables, outputs](03-state-and-variables.md)
4. [Lab: split the hello-world into variables](04-lab-state-and-variables.md)

### The provider you already pasted

5. [Why skip_* and endpoints](05-aws-provider-localstack.md)
6. [Lab: paste the full endpoints map](06-lab-aws-provider-localstack.md) — prerequisite for IAM / Lambda

### Role, then Lambda

7. [IAM: the role Lambda will assume](07-iam-terraform.md)
8. [Lab: add the role](08-lab-iam-terraform.md)
9. [Lambda: zip and invoke](09-lambda-terraform.md)
10. [Lab: add the function](10-lab-lambda-terraform.md)

### The win

11. [Lambda writes a file](11-s3-lambda-pipeline.md)
12. [Lab: invoke and see the object](12-lab-s3-lambda-pipeline.md)

### Wrap-up

13. [What we learned / what's next](13-next-steps.md)

A complete copy of the same stack: [`projects/image-pipeline/`](projects/image-pipeline/).

DynamoDB, secrets, modules, CI, queues, and APIs are in [`aws-intermediate`](../aws-intermediate/README.md).

---

## What you should end up with

- You write and apply Terraform for S3, IAM, and Lambda.
- You invoke a Lambda that puts an object in S3.
- You can explain least-privilege IAM (trust vs permissions).

## Lab structure

One Terraform root: **`~/aws-labs`**. Labs add `iam.tf`, `lambda.tf`, `lambda/handler.py`. Lab 12 is the finished stack.

## Relation to aws-basic

| aws-basic lesson | aws-terraform lesson |
|---|---|
| 03 IAM | 07–08 |
| 06 S3 | 02, 04, 11–12 |
| 08 Lambda | 09–12 |
| 10 LocalStack | 05–06 |

## Next

- [`aws-intermediate`](../aws-intermediate/README.md) — DynamoDB, secrets, KMS, modules, CI, VPC, API Gateway, SQS, EventBridge, observability. Details: [13-next-steps.md](13-next-steps.md).
- A real AWS dev account + AWS Budgets alert.
- Terraform Cloud / S3 backend for state in a team.
