# 22. Lab: GitHub Actions workflow

## Task 1. Copy the workflow

In the `mock-exams` repository, create `.github/workflows/terraform-aws.yml` based on the template from [21-ci-terraform.md](21-ci-terraform.md).

Extend the **localstack-plan** job:

```yaml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - 4566:4566
    env:
      SERVICES: s3,lambda,dynamodb,iam,logs
      DEBUG: "0"

steps:
  # ... checkout, setup-terraform ...
  - name: Plan with LocalStack endpoints
    working-directory: courses/aws-terraform/projects/image-pipeline
    env:
      TF_VAR_use_localstack: "true"
      TF_VAR_localstack_endpoint: http://localhost:4566
    run: |
      terraform init -backend=false
      terraform validate
      terraform plan -input=false
```

Make sure `image-pipeline` supports the `use_localstack` variable (see the project in the repository).

## Task 2. Local check

```bash
cd courses/aws-terraform/projects/image-pipeline
terraform fmt -recursive
terraform init -backend=false
terraform validate
```

## Task 3. Push and PR

Open a PR — the workflow should turn green.

## Success criteria

- [ ] `fmt -check` passes
- [ ] `validate` passes
- [ ] `plan` in CI completes (0 changes or the expected diff)

Next lesson: [23-final-project.md](23-final-project.md).
