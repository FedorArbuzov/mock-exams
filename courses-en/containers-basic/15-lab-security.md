# 15. Lab: image hardening and checks

## Lab goal

Check **non-root** on the stand, strengthen the **.dockerignore**, optionally run a **read-only** container, run a **scan** (if trivy is installed), and record a checklist.

## Prerequisites

```bash
cd deploy/containers
docker compose up -d --build
```

Theory: [14. Security](14-security.md).

---

## Task 1. USER and processes

```bash
docker exec mock-containers-api id
docker exec mock-containers-api ps aux 2>/dev/null || docker top mock-containers-api
```

**What you'll see:** uid=10001; the python process is not run as root.

---

## Task 2. Secrets not in the image

```bash
docker history mock-containers-api --no-trunc | grep -i env || echo "no obvious ENV secrets"
echo 'FAKE_SECRET=do-not-commit' > stack/api/.env
docker build -t lab/api:sec-test ./stack/api 2>&1 | tail -5
```

Copy [`examples/.dockerignore`](examples/.dockerignore) into `stack/api/.dockerignore`, then rebuild:

```bash
docker build -t lab/api:sec-test ./stack/api
docker run --rm lab/api:sec-test ls -la .env 2>&1 || echo "expected: .env not in image"
rm -f stack/api/.env stack/api/.dockerignore
```

**What you'll see:** without the ignore, `.env` could have ended up in a layer; with the ignore — the file is absent.

---

## Task 3. Read-only root (learning run)

```bash
docker run --rm --read-only --tmpfs /tmp \
  -e REDIS_HOST=127.0.0.1 lab/api:manual python -c "print('ro ok')" 2>/dev/null || \
docker run --rm --read-only --tmpfs /tmp lab/api:manual id
```

**What you'll see:** a simple command works; a full Flask on RO will require tmpfs for writes — discuss it in your report.

---

## Task 4. Capabilities (overview)

```bash
docker inspect mock-containers-api --format '{{.HostConfig.CapDrop}} {{.HostConfig.Privileged}}'
```

**What you'll see:** `Privileged=false`; CapDrop may be empty (default) — in K8s you'll configure drop ALL.

---

## Task 5. Scan (optional)

```bash
command -v trivy && trivy image --severity HIGH,CRITICAL mock-containers-api || echo "install trivy for scan"
```

Record the **number** of HIGH/CRITICAL in your notes. Remediation plan: update the base image.

---

## Task 6. Hardening checklist (fill in)

| Item | Stand api | Your service |
|-------|-----------|------------|
| Non-root USER | ☐ | ☐ |
| No secrets in the Dockerfile | ☐ | ☐ |
| .dockerignore | ☐ | ☐ |
| Slim / multistage base | ☐ | ☐ |
| Scan in CI | ☐ | ☐ |
| Redis not on a host port | ☐ | ☐ |
| A single published port (web) | ☐ | ☐ |

---

## Task 7. Comparison with GitLab

Read the snippet in [gitlab-intermediate/03-docker-registry](../gitlab-intermediate/03-docker-registry.md) — where `docker login` and push are. Add to your notes: **the scan must run before push to the prod registry**.

---

## Success criteria

- [ ] api runs as UID ≠ 0
- [ ] You understand the role of `.dockerignore` for `.env`
- [ ] You tried `--read-only` + tmpfs
- [ ] The checklist is filled in
- [ ] You know where to embed trivy in CI

## What to take to work

- Hardening is part of the **Definition of Done** for a Dockerfile
- Secrets → runtime, not layers
- The combination of GitLab Registry + Container Scanning

Next lesson: [16. Docker vs Kubernetes](16-docker-vs-kubernetes.md).
