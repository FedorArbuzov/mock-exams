# LocalStack + lab toolbox

Stand for [`aws-terraform`](../../courses-en/aws-terraform/README.md): LocalStack on **4566**, plus a `lab` container with Terraform, AWS CLI, and `verify-final`.

Work in **`~/aws-labs`** on the host or inside `lab` — same folder, same state.

**Images (pull, no local build):**

| Service | Image |
|---------|--------|
| localstack | `localstack/localstack:3.8` |
| lab | `ghcr.io/fedorarbuzov/mock-exams/aws-terraform-lab:latest` |

## Start

From the **mock-exams** repo root:

```powershell
docker compose -f deploy/aws-terraform/docker-compose.yml pull
docker compose -f deploy/aws-terraform/docker-compose.yml up -d
```

```bash
docker compose -f deploy/aws-terraform/docker-compose.yml pull
docker compose -f deploy/aws-terraform/docker-compose.yml up -d
```

Sanity:

```bash
curl -s http://localhost:4566/_localstack/health
docker compose -f deploy/aws-terraform/docker-compose.yml exec lab terraform version
docker compose -f deploy/aws-terraform/docker-compose.yml exec lab aws --version
```

If port **4566** is busy, stop the other LocalStack (`~/.mock-exams/localstack` or `deploy/localstack`) first.

Override the lab image: `$env:AWS_TERRAFORM_LAB_IMAGE` / `export AWS_TERRAFORM_LAB_IMAGE=...`.

## Host (default)

Terraform and AWS CLI on the laptop, endpoint `http://localhost:4566` — same as [ENVIRONMENT.md](../../courses-en/aws-terraform/ENVIRONMENT.md).

## Inside the container (fallback)

Host tools broken (Windows AWS CLI, no Terraform) — same commands in `lab`. `localhost:4566` still works (proxied to LocalStack).

```powershell
docker compose -f deploy/aws-terraform/docker-compose.yml exec lab bash
```

```bash
# already inside /aws-labs
terraform apply -var-file=dev.tfvars
aws --endpoint-url=http://localhost:4566 s3 ls
lab-help
```

One-shot without a shell:

```bash
docker compose -f deploy/aws-terraform/docker-compose.yml exec lab \
  terraform apply -var-file=dev.tfvars
```

After lab 12:

```bash
docker compose -f deploy/aws-terraform/docker-compose.yml exec lab \
  verify-final --bucket "$(terraform output -raw bucket_name)" \
  --lambda "$(terraform output -raw lambda_function_name)" --invoke
```

(`terraform output` in that one-liner must run **inside** `lab` or on the host from `~/aws-labs`.)

## Stop

```bash
docker compose -f deploy/aws-terraform/docker-compose.yml down
# wipe LocalStack data: add -v
```

`~/aws-labs` is on the host and is not deleted.

## What is in `lab`

| Tool | Role |
|------|------|
| Terraform 1.9 | `plan` / `apply` |
| AWS CLI v2 | `aws --endpoint-url=http://localhost:4566 …` |
| `verify-final` | optional probe after lab 12 |
| `lab-help` | short reminder |

Interactive Check in the courses UI still uses the **UI / host** AWS CLI, not this container. If Check is red but `lab` is green, trust `lab`.

## Rebuild (maintainers)

```bash
docker compose -f deploy/aws-terraform/docker-compose.yml build lab
docker compose -f deploy/aws-terraform/docker-compose.yml push lab
```

CI: [`.github/workflows/aws-terraform-lab.yml`](../../.github/workflows/aws-terraform-lab.yml) pushes `linux/amd64` and `linux/arm64` to GHCR.
