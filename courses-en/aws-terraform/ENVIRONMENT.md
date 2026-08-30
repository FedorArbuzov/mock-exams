# Environment for AWS + Terraform

This course uses **LocalStack** (AWS emulator in Docker) and the **courses UI** for lessons. You do **not** need Kubernetes, minikube, or the `mockctl` CLI.

## What you need

| Piece | Role |
|-------|------|
| Docker Desktop | Runs LocalStack, `lab`, and the courses UI |
| One-liner | LocalStack **and** Terraform/AWS CLI **and** lessons on **:8091** |
| Courses UI | Same stack — **http://127.0.0.1:8091/aws-terraform/README.md** |

**No Kubernetes.** Enable it only if you also take K8s / GitLab deploy courses.

## One-time setup

### A. Docker Desktop

Install and start Docker Desktop. Kubernetes can stay **off**.

```bash
docker info
```

### B. LocalStack + lab (one-liner)

This starts **LocalStack on :4566**, a **`lab` container** (Terraform + AWS CLI), and the **courses UI on :8091**. Work in **`~/aws-labs`**. Interactive Check talks to LocalStack via AWS CLI inside the UI container.

Public ([LOCALSTACK.md](https://github.com/FedorArbuzov/mockctl-setup/blob/main/LOCALSTACK.md)):

```powershell
# Windows
irm https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/windows-localstack-up.ps1 | iex
```

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/unix-localstack-up.sh | bash
```

From this repo:

```powershell
.\scripts\windows-localstack-up.ps1
```

```bash
bash scripts/unix-localstack-up.sh
```

Then:

```bash
curl -s http://localhost:4566/_localstack/health
# open http://127.0.0.1:8091/aws-terraform/README.md
docker compose -f ~/.mock-exams/localstack/docker-compose.yml exec lab terraform version
docker compose -f ~/.mock-exams/localstack/docker-compose.yml exec lab bash
```

Windows: `%USERPROFILE%\.mock-exams\localstack\docker-compose.yml`.

Stop:

```bash
docker compose -f ~/.mock-exams/localstack/docker-compose.yml down
```

Details: [`deploy/aws-terraform/README.md`](../../deploy/aws-terraform/README.md).

### C. Tools on the host

Skip this section if you use the **lab** container above — Terraform and AWS CLI are already inside `lab`.

Terraform ≥ 1.5 on the host ([lesson 01](01-terraform-intro.md)). Full official instructions: [Install Terraform](https://developer.hashicorp.com/terraform/install).

```powershell
# Windows
winget install --id Hashicorp.Terraform -e
```

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

Linux: [Install Terraform](https://developer.hashicorp.com/terraform/install).

AWS CLI — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html). Interactive Check calls `aws` against LocalStack (`s3api head-bucket` and similar). **v1 or v2** is enough for this course.

```powershell
# Windows — current user, no admin (official v2 script).
# Avoid: winget install Amazon.AWSCLI (machine MSI + UAC, looks stuck while downloading).
irm https://awscli.amazonaws.com/v2/install.ps1 | iex
```

```bash
# macOS
brew install awscli
```

**Windows 11 — if `aws --version` or Check dies with `DLL load failed … _awscrt`:** Smart App Control is blocking the official v2 native module. Do not keep debugging Terraform. Install CLI **v1** (pure Python) and make sure it is the `aws` on PATH:

```powershell
python -m pip install --user awscli
# pip prints the Scripts folder if it is not on PATH — add it, then open a new terminal
aws --version
# expect: aws-cli/1.x  (not a Python traceback)
```

If `where.exe aws` still points at `C:\Program Files\Amazon\AWSCLIV2\aws.exe` and that exe crashes, remove v2 so the pip CLI wins:

```powershell
winget uninstall --id Amazon.AWSCLI -e
```

Restart **`mockctl web`** after `aws` works — Check uses the UI process PATH, not a later terminal.

Then, in a **new** terminal:

```bash
terraform version          # ≥ 1.5
aws --version              # 1.x or 2.x
```

Fake credentials for LocalStack (put in your shell profile for the session):

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
```

PowerShell:

```powershell
$env:AWS_ACCESS_KEY_ID = "test"
$env:AWS_SECRET_ACCESS_KEY = "test"
$env:AWS_DEFAULT_REGION = "us-east-1"
```

### D. Courses UI

Already started by the one-liner in **B**. Open **http://127.0.0.1:8091/aws-terraform/README.md**.

Do **not** use the main mockctl-web one-liner (that path needs Kubernetes). A leftover `mockctl-web` on **8091** will block this stack — the LocalStack script removes it.

**Requires:** LocalStack on **http://localhost:4566**. Check from the UI uses `aws` inside the `web` container against `http://localstack:4566`.

## How labs work

1. **Read** the theory page in the courses UI (or in the repo).
2. **Do** the lab in **`~/aws-labs`** (one Terraform root for the whole course).
3. **Check** — lessons with a sidecar `*.lab.json` show **Interactive Check** in the UI (queries LocalStack via AWS API — same idea as Kubernetes labs). Other lessons: self-check in the text. Optional probe: [`scripts/verify-final.sh`](scripts/verify-final.sh).

## Working directory tip

Keep Terraform roots outside the courses tree so you do not mix lesson state:

```text
~/aws-labs/          # one project — labs 02 → 12 add files here
  main.tf
  variables.tf
  iam.tf             # from lab 08
  lambda.tf          # from lab 10
  lambda/handler.py
```

Complete copy of the same stack: [`projects/image-pipeline/`](projects/image-pipeline/).

## Sanity checklist

- [ ] `docker info` works  
- [ ] `curl http://localhost:4566/_localstack/health` → 200  
- [ ] **http://127.0.0.1:8091/aws-terraform/README.md** opens  
- [ ] `terraform version` ≥ 1.5 (host **or** `docker compose … exec lab terraform version`)  
- [ ] provider `endpoints` point at LocalStack (lesson 05)  

## Related

- [LOCALSTACK.md](https://github.com/FedorArbuzov/mockctl-setup/blob/main/LOCALSTACK.md) — public one-liner  
- [`deploy/aws-terraform`](../../deploy/aws-terraform/README.md) — LocalStack + lab (Terraform / AWS CLI)  
- [deploy/localstack](../../deploy/localstack/README.md) — LocalStack only  
- Next after this course: [`aws-intermediate`](../aws-intermediate/README.md)  
