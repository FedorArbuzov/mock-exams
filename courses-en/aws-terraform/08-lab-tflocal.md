# 08. Lab: workflow with tflocal

## Preparation

```bash
pip install terraform-local
docker compose -f deploy/localstack/docker-compose.yml up -d
mkdir -p ~/aws-labs/lesson-08 && cd ~/aws-labs/lesson-08
```

## Task 1. Minimal project (without endpoints)

`versions.tf` — same as in lesson 02.

`provider.tf`:

```hcl
provider "aws" {
  region = "us-east-1"
}
```

`main.tf`:

```hcl
resource "aws_s3_bucket" "tflocal_demo" {
  bucket = "tflocal-demo-yourname-001"
}
```

## Task 2. tflocal init / apply

```bash
tflocal init
tflocal apply
```

**What you'll see:** the file `localstack_providers_override.tf` (auto-generated). The bucket is created.

## Task 3. Plain terraform (expected error)

Stop LocalStack or temporarily change the region to a nonexistent endpoint — `terraform plan` without the override may go to real AWS (careful: use an empty profile or `AWS_ACCESS_KEY_ID=invalid` for the test).

**Lesson takeaway:** without an override / tflocal, the code goes to real AWS — always check `echo $AWS_PROFILE`.

## Task 4. Switching to prod (theory)

Document this in the project README:

```markdown
## Local
tflocal apply

## AWS dev
export AWS_PROFILE=course-dev
terraform apply -var-file=prod.tfvars
```

`prod.tfvars` without localstack variables.

## Success criteria

- [ ] `tflocal apply` created the bucket
- [ ] `localstack_providers_override.tf` in `.gitignore`
- [ ] `tflocal destroy` removed the bucket

Next lesson: [09-iam-terraform.md](09-iam-terraform.md).
