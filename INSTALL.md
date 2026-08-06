# Установка mock-exams

Локальный Kubernetes-кластер за одну команду через утилиту [`mockctl`](mockctl/README.md).

> **Quick start:** Docker Desktop -> Kubernetes -> one-liner instructions are in [QUICKSTART.md](QUICKSTART.md).

## Требования

- **Docker** запущен:
  - Windows / macOS — Docker Desktop.
  - Linux — `docker.io`/`docker-ce` (`sudo systemctl start docker`).
  - WSL — Docker Desktop с WSL Integration **или** docker внутри Ubuntu.
- ~5 ГБ свободного места и доступ в интернет (первый запуск качает образы Kubernetes).

## Windows (PowerShell) — рекомендуется

**Нужно:** Docker Desktop с включённым Kubernetes (Settings → Kubernetes → Create cluster).

Одна команда (после включения Kubernetes в Docker Desktop):

```powershell
irm https://raw.githubusercontent.com/FedorArbuzov/mock-exams-win/main/windows-mockctl-web.ps1 | iex
```

Скрипт: экспортирует kubeconfig → `docker pull` → `docker run` → проверка.

Образ по умолчанию: `ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest` (переопределить: `$env:MOCKCTL_WEB_IMAGE`).

Курсы: http://127.0.0.1:8091/

## macOS / Linux (bash) — рекомендуется

**Нужно:** Docker Desktop с включённым Kubernetes (Settings → Kubernetes → Enable Kubernetes).

Одна команда:

```bash
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams-win/main/unix-mockctl-web.sh | bash
```

Образ по умолчанию: `ghcr.io/fedorarbuzov/mock-exams/mockctl-web:latest` (переопределить: `export MOCKCTL_WEB_IMAGE=...`).

Курсы: http://127.0.0.1:8091/

### Windows — legacy (`mockctl.exe`)

На Windows 11 с **Smart App Control** скачанный `.exe` может не запуститься. Предпочтительнее bootstrap выше.

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

Или одной строкой:

```bash
mc=~/mockctl && curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-linux-amd64 -o "$mc" && chmod +x "$mc" && "$mc" install && "$mc" up && "$mc" status
```

Для arm64 замените `mockctl-linux-amd64` на `mockctl-linux-arm64`.

## macOS

Однострочник с авто-определением архитектуры (Apple Silicon или Intel):

```bash
mc=~/mockctl && arch=$(uname -m | sed 's/x86_64/amd64/') && curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-darwin-${arch} -o "$mc" && chmod +x "$mc" && "$mc" install && "$mc" up && "$mc" status
```

То же по шагам:

```bash
mc=~/mockctl
arch=$(uname -m | sed 's/x86_64/amd64/')   # arm64 (Apple Silicon) или amd64 (Intel)
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-darwin-${arch} -o "$mc"
chmod +x "$mc"
"$mc" install
"$mc" up
"$mc" status
```

## Использование кластера

`mockctl up` создаёт `output/kubeconfig.yaml`. Дальше:

```bash
export KUBECONFIG="$PWD/output/kubeconfig.yaml"
kubectl get nodes
kubectl get pods -A
```

PowerShell-аналог:

```powershell
$env:KUBECONFIG = "$PWD\output\kubeconfig.yaml"
kubectl get nodes
```

## Жизненный цикл

```bash
mockctl up              # поднять (первый раз 3-5 мин, далее быстрее)
mockctl status          # ноды + поды
mockctl kubeconfig      # перевыгрузить kubeconfig, если порт сменился
mockctl down --soft     # остановить, сохранить состояние (повторный up ~30 сек)
mockctl down            # удалить кластер
mockctl clean --full    # полный сброс данных, бинарники остаются
mockctl uninstall --yes # снести всё, включая minikube/kubectl
```

## Если что-то пошло не так

| Симптом | Что делать |
|---|---|
| `docker is installed but the daemon is not responding` | Запустите Docker Desktop, или на Linux/WSL: `sudo service docker start` |
| `permission denied while trying to connect ... docker.sock` | `sudo usermod -aG docker "$USER"`, затем (для WSL из PowerShell) `wsl --shutdown` и заново открыть терминал |
| `winget : not recognized` (Windows) | Установите App Installer из Microsoft Store: <https://apps.microsoft.com/detail/9nblggh4nns1> |
| `connection refused` при `kubectl ...` | `mockctl kubeconfig` |
| Долго висит на `Verifying ingress addon...` | Подождите 1-2 минуты или используйте `mockctl up --no-addons` |

Подробности по командам и сборке: [`mockctl/README.md`](mockctl/README.md).

## Linux (курсы `linux-*`)

```bash
cd deploy/linux
docker compose build
docker compose up -d
docker compose exec lab bash
```

Стенд: **lab** (172.28.0.10), **srv1** (172.28.0.11), **srv2**, **web**, **dns**. Пользователь: `course` / `course`.

Подробнее: [`deploy/linux/README.md`](deploy/linux/README.md). Маршрут: [`courses/linux-basic`](courses/linux-basic/README.md) → intermediate → advanced.

## GitLab (курсы `gitlab-*`)

Для CI/CD-курсов — GitLab CE в Docker (**4+ ГБ RAM**):

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

Откройте [http://localhost:8929](http://localhost:8929), пароль root:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Регистрация runner: [`deploy/gitlab/README.md`](deploy/gitlab/README.md).

## AWS LocalStack (курсы `aws-*`)

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
```

## PostgreSQL (курсы `postgresql-*`)

```bash
cd deploy/postgres
docker compose build
docker compose up -d
psql "postgresql://course:course@localhost:5432/course"
```

Образ включает `hypopg`, `pgaudit`, `pg_trgm` (мини-курсы performance / security / developer).

pgAdmin: [http://localhost:5050](http://localhost:5050). Подробнее: [`deploy/postgres/README.md`](deploy/postgres/README.md).

**Flyway** (курс `postgresql-developer`): [Flyway CLI](https://flywaydb.org/download).

**MinIO** (курс `postgresql-ops`, опционально):

```bash
docker compose -f deploy/postgres/docker-compose.yml -f deploy/postgres/docker-compose.ops.yml up -d
```

Специализации: [`postgresql-performance`](courses/postgresql-performance/README.md), [`postgresql-developer`](courses/postgresql-developer/README.md), [`postgresql-ops`](courses/postgresql-ops/README.md), [`postgresql-security`](courses/postgresql-security/README.md).

## Карта курсов

[`courses/devops-path.md`](courses/devops-path.md)
