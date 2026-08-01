# 06. Lab: LocalStack + provider

## Preparation

From the root of the `mock-exams` repository:

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
curl -s http://localhost:4566/_localstack/health
```

Windows PowerShell:

```powershell
docker compose -f deploy/localstack/docker-compose.yml up -d
Invoke-WebRequest -Uri http://localhost:4566/_localstack/health -UseBasicParsing
```

## Task 1. provider.tf (full version)

Copy the pattern from [05-aws-provider-localstack.md](05-aws-provider-localstack.md) into `~/aws-labs/lesson-02` or create `lesson-06`.

## Task 2. apply bucket

```bash
cd ~/aws-labs/lesson-02
terraform apply -var-file=terraform.tfvars
```

## Task 3. AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

aws --endpoint-url=http://localhost:4566 s3 ls
aws --endpoint-url=http://localhost:4566 s3 cp README.md s3://YOUR_BUCKET/test.txt
aws --endpoint-url=http://localhost:4566 s3 ls s3://YOUR_BUCKET/
```

## Task 4. use_localstack flag

Add `variable "use_localstack"` and `dynamic "endpoints"` from lesson 05.

`local.tfvars`:

```hcl
use_localstack = true
bucket_name    = "course-local-yourname"
```

## Task 5. LocalStack logs on error

```bash
docker compose -f deploy/localstack/docker-compose.yml logs -f localstack
```

## Success criteria

- [ ] The health endpoint responds
- [ ] `terraform apply` created the bucket
- [ ] The CLI uploaded and read the object
- [ ] After `destroy` the bucket disappeared from `s3 ls`

## Stopping

```bash
docker compose -f deploy/localstack/docker-compose.yml down
```

(path: `deploy/localstack/docker-compose.yml`)

Next lesson: [07-tflocal.md](07-tflocal.md).
