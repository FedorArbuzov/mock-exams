# РЈСЃС‚Р°РЅРѕРІРєР° mock-exams

Р›РѕРєР°Р»СЊРЅС‹Р№ Kubernetes-РєР»Р°СЃС‚РµСЂ Р·Р° РѕРґРЅСѓ РєРѕРјР°РЅРґСѓ С‡РµСЂРµР· СѓС‚РёР»РёС‚Сѓ [`mockctl`](mockctl/README.md).

> **Quick start:** Docker Desktop -> Kubernetes -> one-liner instructions are in [QUICKSTART.md](QUICKSTART.md).

## РўСЂРµР±РѕРІР°РЅРёСЏ

- **Docker** Р·Р°РїСѓС‰РµРЅ:
  - Windows / macOS вЂ” Docker Desktop.
  - Linux вЂ” `docker.io`/`docker-ce` (`sudo systemctl start docker`).
  - WSL вЂ” Docker Desktop СЃ WSL Integration **РёР»Рё** docker РІРЅСѓС‚СЂРё Ubuntu.
- ~5 Р“Р‘ СЃРІРѕР±РѕРґРЅРѕРіРѕ РјРµСЃС‚Р° Рё РґРѕСЃС‚СѓРї РІ РёРЅС‚РµСЂРЅРµС‚ (РїРµСЂРІС‹Р№ Р·Р°РїСѓСЃРє РєР°С‡Р°РµС‚ РѕР±СЂР°Р·С‹ Kubernetes).

## Windows (PowerShell) вЂ” СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ

**РќСѓР¶РЅРѕ:** Docker Desktop СЃ РІРєР»СЋС‡С‘РЅРЅС‹Рј Kubernetes (Settings в†’ Kubernetes в†’ Create cluster).

РћРґРЅР° РєРѕРјР°РЅРґР° (РїРѕСЃР»Рµ РІРєР»СЋС‡РµРЅРёСЏ Kubernetes РІ Docker Desktop):

```powershell
irm https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/windows-mockctl-web.ps1 | iex
```

РЎРєСЂРёРїС‚: СЌРєСЃРїРѕСЂС‚РёСЂСѓРµС‚ kubeconfig в†’ `docker pull` в†’ `docker run` в†’ РїСЂРѕРІРµСЂРєР°.

РћР±СЂР°Р· РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ: `ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest` (РїРµСЂРµРѕРїСЂРµРґРµР»РёС‚СЊ: `$env:MOCKCTL_WEB_IMAGE`).

РљСѓСЂСЃС‹: http://127.0.0.1:8091/

## macOS / Linux (bash) вЂ” СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ

**РќСѓР¶РЅРѕ:** Docker Desktop СЃ РІРєР»СЋС‡С‘РЅРЅС‹Рј Kubernetes (Settings в†’ Kubernetes в†’ Enable Kubernetes).

РћРґРЅР° РєРѕРјР°РЅРґР°:

```bash
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/unix-mockctl-web.sh | bash
```

РћР±СЂР°Р· РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ: `ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest` (РїРµСЂРµРѕРїСЂРµРґРµР»РёС‚СЊ: `export MOCKCTL_WEB_IMAGE=...`).

РљСѓСЂСЃС‹: http://127.0.0.1:8091/

### Windows вЂ” legacy (`mockctl.exe`)

РќР° Windows 11 СЃ **Smart App Control** СЃРєР°С‡Р°РЅРЅС‹Р№ `.exe` РјРѕР¶РµС‚ РЅРµ Р·Р°РїСѓСЃС‚РёС‚СЊСЃСЏ. РџСЂРµРґРїРѕС‡С‚РёС‚РµР»СЊРЅРµРµ bootstrap РІС‹С€Рµ.

```powershell
$mc="$env:USERPROFILE\mockctl.exe"
iwr https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-windows-amd64.exe -OutFile $mc -UseBasicParsing
& $mc install
& $mc up
& $mc status
```

## Linux / WSL (bash)

```bash
mc=~/mockctl
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-linux-amd64 -o "$mc"
chmod +x "$mc"
"$mc" install
"$mc" up
"$mc" status
```

РР»Рё РѕРґРЅРѕР№ СЃС‚СЂРѕРєРѕР№:

```bash
mc=~/mockctl && curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-linux-amd64 -o "$mc" && chmod +x "$mc" && "$mc" install && "$mc" up && "$mc" status
```

Р”Р»СЏ arm64 Р·Р°РјРµРЅРёС‚Рµ `mockctl-linux-amd64` РЅР° `mockctl-linux-arm64`.

## macOS

РћРґРЅРѕСЃС‚СЂРѕС‡РЅРёРє СЃ Р°РІС‚Рѕ-РѕРїСЂРµРґРµР»РµРЅРёРµРј Р°СЂС…РёС‚РµРєС‚СѓСЂС‹ (Apple Silicon РёР»Рё Intel):

```bash
mc=~/mockctl && arch=$(uname -m | sed 's/x86_64/amd64/') && curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-darwin-${arch} -o "$mc" && chmod +x "$mc" && "$mc" install && "$mc" up && "$mc" status
```

РўРѕ Р¶Рµ РїРѕ С€Р°РіР°Рј:

```bash
mc=~/mockctl
arch=$(uname -m | sed 's/x86_64/amd64/')   # arm64 (Apple Silicon) РёР»Рё amd64 (Intel)
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-darwin-${arch} -o "$mc"
chmod +x "$mc"
"$mc" install
"$mc" up
"$mc" status
```

## РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ РєР»Р°СЃС‚РµСЂР°

`mockctl up` СЃРѕР·РґР°С‘С‚ `output/kubeconfig.yaml`. Р”Р°Р»СЊС€Рµ:

```bash
export KUBECONFIG="$PWD/output/kubeconfig.yaml"
kubectl get nodes
kubectl get pods -A
```

PowerShell-Р°РЅР°Р»РѕРі:

```powershell
$env:KUBECONFIG = "$PWD\output\kubeconfig.yaml"
kubectl get nodes
```

## Р–РёР·РЅРµРЅРЅС‹Р№ С†РёРєР»

```bash
mockctl up              # РїРѕРґРЅСЏС‚СЊ (РїРµСЂРІС‹Р№ СЂР°Р· 3-5 РјРёРЅ, РґР°Р»РµРµ Р±С‹СЃС‚СЂРµРµ)
mockctl status          # РЅРѕРґС‹ + РїРѕРґС‹
mockctl kubeconfig      # РїРµСЂРµРІС‹РіСЂСѓР·РёС‚СЊ kubeconfig, РµСЃР»Рё РїРѕСЂС‚ СЃРјРµРЅРёР»СЃСЏ
mockctl down --soft     # РѕСЃС‚Р°РЅРѕРІРёС‚СЊ, СЃРѕС…СЂР°РЅРёС‚СЊ СЃРѕСЃС‚РѕСЏРЅРёРµ (РїРѕРІС‚РѕСЂРЅС‹Р№ up ~30 СЃРµРє)
mockctl down            # СѓРґР°Р»РёС‚СЊ РєР»Р°СЃС‚РµСЂ
mockctl clean --full    # РїРѕР»РЅС‹Р№ СЃР±СЂРѕСЃ РґР°РЅРЅС‹С…, Р±РёРЅР°СЂРЅРёРєРё РѕСЃС‚Р°СЋС‚СЃСЏ
mockctl uninstall --yes # СЃРЅРµСЃС‚Рё РІСЃС‘, РІРєР»СЋС‡Р°СЏ minikube/kubectl
```

## Р•СЃР»Рё С‡С‚Рѕ-С‚Рѕ РїРѕС€Р»Рѕ РЅРµ С‚Р°Рє

| РЎРёРјРїС‚РѕРј | Р§С‚Рѕ РґРµР»Р°С‚СЊ |
|---|---|
| `docker is installed but the daemon is not responding` | Р—Р°РїСѓСЃС‚РёС‚Рµ Docker Desktop, РёР»Рё РЅР° Linux/WSL: `sudo service docker start` |
| `permission denied while trying to connect ... docker.sock` | `sudo usermod -aG docker "$USER"`, Р·Р°С‚РµРј (РґР»СЏ WSL РёР· PowerShell) `wsl --shutdown` Рё Р·Р°РЅРѕРІРѕ РѕС‚РєСЂС‹С‚СЊ С‚РµСЂРјРёРЅР°Р» |
| `winget : not recognized` (Windows) | РЈСЃС‚Р°РЅРѕРІРёС‚Рµ App Installer РёР· Microsoft Store: <https://apps.microsoft.com/detail/9nblggh4nns1> |
| `connection refused` РїСЂРё `kubectl ...` | `mockctl kubeconfig` |
| Р”РѕР»РіРѕ РІРёСЃРёС‚ РЅР° `Verifying ingress addon...` | РџРѕРґРѕР¶РґРёС‚Рµ 1-2 РјРёРЅСѓС‚С‹ РёР»Рё РёСЃРїРѕР»СЊР·СѓР№С‚Рµ `mockctl up --no-addons` |

РџРѕРґСЂРѕР±РЅРѕСЃС‚Рё РїРѕ РєРѕРјР°РЅРґР°Рј Рё СЃР±РѕСЂРєРµ: [`mockctl/README.md`](mockctl/README.md).

## Linux (РєСѓСЂСЃС‹ `linux-*`)

```bash
cd deploy/linux
docker compose build
docker compose up -d
docker compose exec lab bash
```

РЎС‚РµРЅРґ: **lab** (172.28.0.10), **srv1** (172.28.0.11), **srv2**, **web**, **dns**. РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ: `course` / `course`.

РџРѕРґСЂРѕР±РЅРµРµ: [`deploy/linux/README.md`](deploy/linux/README.md). РњР°СЂС€СЂСѓС‚: [`courses/linux-basic`](courses/linux-basic/README.md) в†’ intermediate в†’ advanced.

## GitLab (РєСѓСЂСЃС‹ `gitlab-*`)

Р”Р»СЏ CI/CD-РєСѓСЂСЃРѕРІ вЂ” GitLab CE РІ Docker (**4+ Р“Р‘ RAM**):

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

РћС‚РєСЂРѕР№С‚Рµ [http://localhost:8929](http://localhost:8929), РїР°СЂРѕР»СЊ root:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Р РµРіРёСЃС‚СЂР°С†РёСЏ runner: [`deploy/gitlab/README.md`](deploy/gitlab/README.md).

## AWS LocalStack (aws-terraform)

**No Kubernetes.** One-liner starts LocalStack **and** the Terraform/AWS CLI `lab` container: [LOCALSTACK.md](https://github.com/FedorArbuzov/mockctl-setup/blob/main/LOCALSTACK.md)

```powershell
# Windows
irm https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/windows-localstack-up.ps1 | iex
```

```bash
# macOS / Linux
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mockctl-setup/main/unix-localstack-up.sh | bash
```

From this repo: `.\scripts\windows-localstack-up.ps1` / `bash scripts/unix-localstack-up.sh`.

Then `docker compose -f ~/.mock-exams/localstack/docker-compose.yml exec lab bash`. Work in `~/aws-labs`.

Course setup: [courses-en/aws-terraform/ENVIRONMENT.md](courses-en/aws-terraform/ENVIRONMENT.md).


## PostgreSQL (РєСѓСЂСЃС‹ `postgresql-*`)

```bash
cd deploy/postgres
docker compose build
docker compose up -d
psql "postgresql://course:course@localhost:5432/course"
```

РћР±СЂР°Р· РІРєР»СЋС‡Р°РµС‚ `hypopg`, `pgaudit`, `pg_trgm` (РјРёРЅРё-РєСѓСЂСЃС‹ performance / security / developer).

pgAdmin: [http://localhost:5050](http://localhost:5050). РџРѕРґСЂРѕР±РЅРµРµ: [`deploy/postgres/README.md`](deploy/postgres/README.md).

**Flyway** (РєСѓСЂСЃ `postgresql-developer`): [Flyway CLI](https://flywaydb.org/download).

**MinIO** (РєСѓСЂСЃ `postgresql-ops`, РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ):

```bash
docker compose -f deploy/postgres/docker-compose.yml -f deploy/postgres/docker-compose.ops.yml up -d
```

РЎРїРµС†РёР°Р»РёР·Р°С†РёРё: [`postgresql-performance`](courses/postgresql-performance/README.md), [`postgresql-developer`](courses/postgresql-developer/README.md), [`postgresql-ops`](courses/postgresql-ops/README.md), [`postgresql-security`](courses/postgresql-security/README.md).

## РљР°СЂС‚Р° РєСѓСЂСЃРѕРІ

[`courses/devops-path.md`](courses/devops-path.md)
