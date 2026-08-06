# mockctl web (Docker)

Browser UI for `courses-en/` and interactive lab checks (`Start lab` / `Check` / `Cleanup`).

The Kubernetes cluster runs on the **host** (Docker Desktop Kubernetes). This container serves the web UI and runs `kubectl` against the host API via `host.docker.internal`.

## Fast local loop (recommended)

Prerequisites: Docker Desktop with Kubernetes enabled.

From repo root:

```powershell
# Windows
.\scripts\dev-mockctl-web.ps1
```

```bash
# macOS / Linux
./scripts/dev-mockctl-web.sh
```

Open http://127.0.0.1:8091/

| Goal | Command |
|------|---------|
| Rebuild image + restart | `.\scripts\dev-mockctl-web.ps1` |
| Restart without rebuild | `.\scripts\dev-mockctl-web.ps1 -SkipBuild` |
| Logs | `docker logs -f mockctl-web` |
| Stop | `docker rm -f mockctl-web` |

Rebuild is needed when you change `courses-en/`, `mockctl/`, or `deploy/mockctl-web/`.

## Even faster: courses only (no Docker rebuild)

Edit markdown and reload the browser. Run `mockctl web` against the disk tree (needs Go on the host):

```powershell
cd mockctl
go run . web --courses-dir ..\courses-en --bind 127.0.0.1 --port 8091
```

```bash
cd mockctl
go run . web --courses-dir ../courses-en --bind 127.0.0.1 --port 8091
```

Interactive lab **Start/Check** still needs a working kubeconfig (`docker-desktop` context). This path does **not** bake courses into a container — F5 picks up `.md` edits.

## Manual docker build

```bash
docker build -f deploy/mockctl-web/Dockerfile -t mock-exams/mockctl-web:local .
```

## Image registry (CI / students)

```bash
docker build -f deploy/mockctl-web/Dockerfile -t ghcr.io/OWNER/mock-exams/mockctl-web:latest .
docker push ghcr.io/OWNER/mock-exams/mockctl-web:latest
```

Students use the one-liners in [QUICKSTART.md](../../QUICKSTART.md).
