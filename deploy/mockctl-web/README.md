# mockctl web (Docker)

Browser UI for `courses-en/` and interactive lab checks (`Start lab` / `Check` / `Cleanup`).

The Kubernetes cluster runs on the **host** (minikube, docker driver). This container only serves the web UI and runs `kubectl` against the host API via `host.docker.internal`.

## Prerequisites

- Docker Desktop running
- minikube profile `mock-exams` up and `output/kubeconfig.yaml` present

Quick path (Windows, one command from repo root):

```powershell
.\scripts\windows-bootstrap.ps1
```

## Manual

```powershell
.\scripts\minikube-up.ps1
docker compose -f deploy/mockctl-web/docker-compose.yml up -d --build
```

Open http://127.0.0.1:8091/

## Image registry

Build and tag for your registry:

```bash
docker build -f deploy/mockctl-web/Dockerfile -t ghcr.io/OWNER/mock-exams/mockctl-web:latest .
docker push ghcr.io/OWNER/mock-exams/mockctl-web:latest
```

Bootstrap pulls `MOCKCTL_WEB_IMAGE` (see `scripts/windows-bootstrap.ps1`). Default for local dev: build `mock-exams/mockctl-web:local`.
