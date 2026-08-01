# 00. Environment: GitLab, runner, registry, mockctl

## Real-world scenario

Monday, 14:30. You copied a `.gitlab-ci.yml` from the wiki, push — the pipeline is **pending** forever. A colleague: "our runner has the `k8s` tag." You change tags — the job starts and fails with `docker: command not found`: it's a shell runner, not a docker executor. The next day the build is green but deploy fails: `Unable to connect to the server` — the kubeconfig in the variable went stale after `mockctl down` → `up`. Third incident: the image is in the registry, but the pod is in `ImagePullBackOff` — you forgot `imagePullSecrets`.

Three symptoms — three layers: **GitLab + runner**, **Container Registry**, **Kubernetes**. Intermediate lives at the intersection of all three. This lesson locks down the stand **before** [02-lab-multi-stage.md](02-lab-multi-stage.md), so you debug the pipeline, not Docker Desktop.

**Prerequisites:** [`gitlab-basic`](../gitlab-basic/README.md), [`kuber-basic`](../kuber-basic/README.md), [`mockctl`](../../mockctl/README.md).

## What you'll learn

- How to bring up GitLab CE and a runner from [`deploy/gitlab`](../../deploy/gitlab/README.md).
- How to check the Container Registry and the `$CI_REGISTRY_IMAGE` path.
- How to bring up the `mock-exams` cluster and get an up-to-date kubeconfig.
- The structure of [`examples/k8s-deploy/`](examples/k8s-deploy/) — what goes into build and deploy.
- The "stand is ready" checklist before chapter 01.

---

## Learning stand architecture

```text
┌─────────────────────────────────────────────────────────────┐
│  Host (Windows / macOS / Linux)                             │
│  Docker Desktop                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ mock-gitlab  │  │ mock-runner  │  │ minikube         │ │
│  │ :8929        │──│ docker.sock  │  │ profile mock-    │ │
│  │ + registry   │  │ executor     │  │ exams (mockctl)  │ │
│  └──────────────┘  └──────────────┘  └──────────────────┘ │
│         ▲                  │                    ▲         │
│         │                  │ build/push       │ kubectl   │
│         └──────────────────┴────────────────────┘         │
│                    CI jobs (pipeline)                       │
└─────────────────────────────────────────────────────────────┘
```

Pipeline: **lint/test** → **docker build** (dind) → **push** to the registry → **deploy** with `kubectl` to minikube.

| Component | Container | URL from the host | URL from the runner |
|-----------|-----------|-------------|---------------|
| GitLab CE | `mock-gitlab` | `http://localhost:8929` | `http://gitlab` |
| Runner | `mock-gitlab-runner` | — | docker executor |
| K8s API | minikube | via kubeconfig | see lab 06 |
| Registry | built into GitLab | `localhost:8929` | `$CI_REGISTRY` |

---

## Step 1. Checking prerequisites

Before bringing up the stand, make sure the base courses are done:

```bash
git --version          # ≥ 2.30
docker version
docker compose version
```

| Check | Command | Expectation |
|----------|---------|----------|
| GitLab basic | runner online, tag `docker` | [gitlab-basic/06](../gitlab-basic/06-lab-docker-runner.md) |
| K8s basic | `kubectl version --client` | [kuber-basic](../kuber-basic/README.md) |
| mockctl | `mockctl version` or `mockctl install` | binary in PATH |

If the runner is not registered — see [gitlab-basic/00-environment.md](../gitlab-basic/00-environment.md).

---

## Step 2. GitLab CE

From the `mock-exams` root:

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
docker exec mock-gitlab gitlab-ctl status
```

The first start takes **5–15 minutes**. UI: [http://localhost:8929](http://localhost:8929).

The `root` password:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

Save the password (the file is deleted after 24 h). Details: [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md).

Stop: `docker compose -f deploy/gitlab/docker-compose.yml down` (volumes keep the data). Full cleanup: `down -v`.

---

## Step 3. Runner with the Docker executor

If you completed [gitlab-basic/06-lab-docker-runner.md](../gitlab-basic/06-lab-docker-runner.md), the runner already exists. Otherwise:

1. **Settings → CI/CD → Runners → New project runner**.
2. Tags: `docker`, `local`.
3. Registration:

```bash
docker exec -it mock-gitlab-runner gitlab-runner register \
  --url http://gitlab \
  --token YOUR_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "local-docker" \
  --tag-list "docker,local" \
  --non-interactive \
  --docker-network-mode host
```

For **Docker-in-Docker** (chapters 03–04) you'll need `privileged = true` in `/etc/gitlab-runner/config.toml` — see [03-docker-registry.md](03-docker-registry.md).

Smoke job:

```yaml
test-runner:
  tags: [docker]
  image: alpine
  script: [echo "runner ok"]
```

The pipeline should become **passed**, not **pending**.

---

## Step 4. Container Registry

The registry is built into GitLab CE. For the `hello-ci` project: **Deploy → Container Registry** — empty until the first push.

| Variable | Example (local) | Who creates it |
|----------|-------------------|-------------|
| `CI_REGISTRY` | `localhost:8929` | GitLab automatically |
| `CI_REGISTRY_IMAGE` | `localhost:8929/root/hello-ci` | GitLab automatically |
| `CI_REGISTRY_USER` | `gitlab-ci-token` | GitLab automatically |
| `CI_REGISTRY_PASSWORD` | job token | GitLab automatically |

Write down the `CI_REGISTRY_IMAGE` path — you'll need it in lab 04.

---

## Step 5. mockctl and kubectl

```bash
mockctl install    # minikube + kubectl, if not already present
mockctl up
mockctl status
```

Expected output: node `Ready`, `output/kubeconfig.yaml` updated.

```bash
export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"   # Linux/macOS
# PowerShell: $env:KUBECONFIG = "$PWD\output\kubeconfig.yaml"

kubectl config current-context
kubectl get nodes
```

If you get `connection refused` after restarting Docker: `mockctl kubeconfig` → repeat `kubectl get nodes`.

Do **not** commit `output/kubeconfig.yaml` to Git. In CI — a **File variable** `KUBECONFIG` (protected) — [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md).

Optionally Helm: [`kuber-intermediate/07-helm.md`](../kuber-intermediate/07-helm.md).

---

## Step 6. Project and examples/k8s-deploy

1. Create the `hello-ci` project (or import [`gitlab-basic/examples/hello-ci`](../gitlab-basic/examples/hello-ci/)).
2. Copy [`examples/k8s-deploy/`](examples/k8s-deploy/):

```text
hello-ci/
├── Dockerfile
├── app/
│   └── index.html            ← a simple HTML page
└── k8s/
    └── deployment.yaml       ← placeholder ${IMAGE}
```

`Dockerfile` (from [`examples/k8s-deploy/Dockerfile`](examples/k8s-deploy/Dockerfile)):

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY app/ ./app/
EXPOSE 8080
CMD ["python", "-m", "http.server", "8080", "--directory", "app"]
```

`k8s/deployment.yaml` — `${IMAGE}` and `imagePullSecrets: gitlab-reg`; substitution in CI via `envsubst` ([06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md)).

---

## Step 7. Registry ↔ cluster (preview)

Kubernetes cannot pull from a private `localhost:8929` without credentials. In lab 06:

```bash
kubectl create secret docker-registry gitlab-reg \
  --docker-server=localhost:8929 \
  --docker-username=root \
  --docker-password=YOUR_PASSWORD \
  -n hello-ci
```

In CI — via `$CI_REGISTRY_*` ([05-deploy-kubernetes.md](05-deploy-kubernetes.md)).

---

## Common mistakes

| Symptom | Frequent cause | What to do |
|---------|----------------|-------------|
| Pipeline pending | no runner / wrong `tags` | Settings → CI/CD → Runners |
| GitLab 502 | still starting | `gitlab-ctl status`, wait 15 min |
| `docker:dind` refused | runner not privileged | [03-docker-registry.md](03-docker-registry.md) |
| kubectl connection refused | stale kubeconfig | `mockctl kubeconfig` |
| Registry push 401 | no `docker login` | `CI_REGISTRY_*` in the job |
| Two Docker / WSL | different daemons | one Docker for GitLab and minikube |

---

## Summary

- Stand: GitLab [`deploy/gitlab`](../../deploy/gitlab/README.md) + cluster [`mockctl`](../../mockctl/README.md).
- Runner with the `docker` tag and (later) `privileged` for dind.
- Registry on the same host `:8929`; deploy by `$CI_COMMIT_SHA`.
- Examples in [`examples/k8s-deploy/`](examples/k8s-deploy/) — the basis of labs 04–06.

---

## Checklist

- [ ] GitLab UI on :8929, `root` login works
- [ ] Project runner with tags `docker` — test job **passed**
- [ ] `mockctl status` — node **Ready**
- [ ] `kubectl get nodes` with `KUBECONFIG=output/kubeconfig.yaml`
- [ ] `hello-ci` project created, `examples/k8s-deploy` in the repository
- [ ] The future `CI_REGISTRY_IMAGE` path is written down
- [ ] You understand where the kubeconfig for CI lives (File variable, not in Git)

Next lesson: [01-multi-stage.md](01-multi-stage.md).
