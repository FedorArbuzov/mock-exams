# 22. Lab: tfsec in CI

## Task 1. Locally

```bash
brew install tfsec   # or go install
cd courses/aws-intermediate/projects/image-platform
tfsec .
```

Fix HIGH findings (if a false positive — `#tfsec:ignore:AWS018` with a comment explaining why).

## Task 2. Workflow

Create `.github/workflows/terraform-aws-intermediate.yml`:

```yaml
name: aws-intermediate-security

on:
  pull_request:
    paths:
      - "courses/aws-intermediate/**"
      - "courses/aws-terraform/projects/**"

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: courses/aws-intermediate/projects/image-platform
          soft_fail: false

  validate:
    runs-on: ubuntu-latest
    defaults:
      run:
        working_directory: courses/aws-intermediate/projects/image-platform
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: |
          cd lambda && zip -j ../lambda.zip handler.py
          cd ../lambda-api && zip -j ../lambda-api.zip api_handler.py
      - run: terraform init -backend=false && terraform validate
```

## Task 3. OIDC (optional, real AWS)

Document in `docs/github-oidc.md` the steps to create the role — do not commit account id secrets.

## Task 4. PR

Open a PR with a README change — workflow green.

## Success criteria

- [ ] tfsec passes with no HIGH
- [ ] terraform validate in CI
- [ ] OIDC plan documented (optional)

Next lesson: [23-final-project.md](23-final-project.md).
