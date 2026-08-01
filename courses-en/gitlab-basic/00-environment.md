# 00. Environment: GitLab CE, runner, hello-ci

## Intro: a real-world scenario

Tuesday, 10:00. You've been added to the "Platform" team: "Bring up GitLab locally, register a runner, push the demo — the pipeline should go green before lunch." You open `http://localhost:8929` — **502 Bad Gateway**. A colleague from the Python track asks: "Why not GitHub Actions?" DevOps answers: "We're on-prem CE, the same `.gitlab-ci.yml` as on the corporate instance." An hour later GitLab finally starts, but the pipeline is **stuck in pending** — the runner isn't registered. A third developer pushes straight to `main`, breaks `main`, and the team lead reminds everyone about **MR + protected branch**.

In the **gitlab-basic** course you build the **full cycle**: Git → GitLab project → `.gitlab-ci.yml` → runner → variables → artifacts. Without a working environment from [`deploy/gitlab`](../../deploy/gitlab/README.md), labs 04–10 turn into "it worked on my machine" theory. This chapter is the foundation: Docker, RAM, the first login, the runner, and the demo application [`examples/hello-ci/`](examples/hello-ci/).

## What you'll learn

- How to bring up **GitLab CE** via `docker compose` on port **8929**.
- Where to get the **root password** at first login and what to do after 24 hours.
- How the **GitLab server** differs from the **GitLab Runner** and why a job without a runner is pending.
- The minimum **RAM requirements** and how to check status with `gitlab-ctl`.
- How to copy **hello-ci** and verify Git locally.
- The readiness checklist for chapter 01.

---

## GitLab CE in mock-exams

In the mock-exams repository, GitLab is packaged for **local learning** — one instance, one runner in compose, no cloud subscription.

| Component | Container / service | Purpose |
|-----------|-------------------|------------|
| GitLab CE | `mock-gitlab` | UI, Git, CI planner, registry (basic) |
| Runner | `mock-gitlab-runner` | runs jobs (docker executor) |
| URL from host | `http://localhost:8929` | browser, `git remote` |
| URL from runner | `http://gitlab` | runner registration inside the compose network |

Full environment documentation: [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md).

### Startup

From the **root** of the mock-exams repository:

```bash
docker compose -f deploy/gitlab/docker-compose.yml up -d
```

**First start — 5–15 minutes.** GitLab initializes the database, configs, and internal services. Don't panic at a 502 — wait and check the status:

```bash
docker exec mock-gitlab gitlab-ctl status
```

All services should be `run`. Then open: [http://localhost:8929](http://localhost:8929).

### Stopping and data

```bash
docker compose -f deploy/gitlab/docker-compose.yml down
```

Volumes **preserve** projects and passwords between restarts. Full cleanup (careful — you'll lose the course projects):

```bash
docker compose -f deploy/gitlab/docker-compose.yml down -v
```

---

## RAM and Docker

GitLab CE is **heavy**. On a laptop with 8 GB RAM, close unnecessary IDEs and browser tabs.

| RAM | Expected behavior |
|-----|---------------------|
| < 4 GB | GitLab may fail to start or get OOM-killed |
| 4–6 GB | OK for a single user, first start is slow |
| 8+ GB | Comfortable for the course + parallel jobs |

In Docker Desktop (Windows/macOS), allocate **at least 6 GB** of memory to containers: Settings → Resources.

Check that Docker is alive:

```bash
docker version
docker compose version
```

---

## First login: the root user

1. Open [http://localhost:8929](http://localhost:8929).
2. Login: **`root`**.
3. Password — a one-time one, from the container:

```bash
docker exec mock-gitlab grep 'Password:' /etc/gitlab/initial_root_password
```

**Save the password** in a password manager. The file `/etc/gitlab/initial_root_password` is **deleted 24 hours** after the first start. If you forget it — reset via `gitlab-rake` (see the official GitLab docs) or recreate the volume with `down -v` (data loss).

After logging in, change the password: **Avatar → Edit profile → Password**. A strong local password is enough for the course.

---

## Git: version and configuration

Pipelines are triggered by **Git events** (push, MR). Without Git on the host you can't do the labs.

```bash
git --version    # target minimum 2.30+
git config --global user.name "Your Name"
git config --global user.email "you@example.local"
```

On Windows use **Git Bash** or PowerShell with Git for Windows. The remote URL for local GitLab:

```text
http://localhost:8929/root/<project-name>.git
```

When prompted for credentials: login `root`, password — your GitLab password. For convenience, set up a [credential helper](https://git-scm.com/docs/gitcredentials) or a Personal Access Token (Settings → Access Tokens, scope `write_repository`).

---

## GitLab Runner: overview

**GitLab** (the server) **plans** the pipeline: it reads `.gitlab-ci.yml`, creates jobs, and queues them.

**The Runner** (an agent) **picks up** a job and runs the `script` in a shell, Docker, or Kubernetes.

```text
push / MR → GitLab creates a pipeline → jobs in the queue
    → Runner with matching tags → docker run image → script → success/fail
```

Without an **online runner** with the right **tags**, jobs stay **pending** (an orange circle) — the most common "incident" in the course.

### Registering a runner (briefly)

In detail — in [05-runners.md](05-runners.md) and [06-lab-docker-runner.md](06-lab-docker-runner.md). The scheme from [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md):

1. In GitLab: **Settings → CI/CD → Runners → New project runner**.
2. Tags: `docker`, `local` (as in the environment README).
3. Copy the registration token.
4. On the host:

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

The URL `http://gitlab` is the service name **inside** the compose docker network. From the host, for API debugging, use `http://host.docker.internal:8929` (Windows/macOS).

Verify: **Settings → CI/CD → Runners** — a green **online** status, tags `docker`.

---

## The hello-ci demo application

The directory [`examples/hello-ci/`](examples/hello-ci/) is a minimal **Python package** for CI labs: `app/`, `tests/`, `pyproject.toml`, ruff + pytest.

Local check **before** push (optional, requires Python 3.12+):

```bash
cd courses/gitlab-basic/examples/hello-ci
pip install -r requirements-dev.txt
pytest tests/ -v
ruff check app/ tests/
```

In lab 04 you'll copy these files into **your own GitLab project** `hello-ci` (you don't have to fork the whole mock-exams). Structure:

```text
hello-ci/
├── app/
│   └── __init__.py
├── tests/
│   └── test_app.py
├── pyproject.toml
├── requirements-dev.txt
└── .gitlab-ci.yml    # you'll add this in the lab
```

---

## Connection to DORA and DevOps culture

CI isn't about "nice checkmarks" — it's the ability to deliver changes **often and safely**. In [`devops-culture`](../devops-culture/03-dora-metrics.md), the **Deployment Frequency** and **Lead Time for Changes** metrics depend directly on how quickly a **green pipeline** after an MR makes it into `main`. At the basic level you lay down the technical minimum: MRs, tests in CI, secrets not in Git.

---

## Common mistakes

| Symptom | Common cause | What to do |
|---------|----------------|-------------|
| 502 on `:8929` | GitLab is still starting | `gitlab-ctl status`, wait 10–15 min |
| `Cannot connect to Docker` | Docker Desktop is off | Start Docker, retry `compose up` |
| Pipeline pending forever | No runner / wrong `tags` | Register a runner, see 05–06 |
| `git push` 403 | Wrong password / no permissions | PAT or change the root password |
| OOM / container crashes | < 4 GB RAM | Increase Docker RAM, close extra apps |
| Root password not found | More than 24h passed | Reset with rake or `down -v` for the learning environment |

---

## Summary

- Environment: `docker compose -f deploy/gitlab/docker-compose.yml up -d` → **http://localhost:8929**.
- Login **root**, password from `initial_root_password`, save it right away.
- A **runner** is required to run jobs; the `docker` tag is the course standard.
- **hello-ci** is the reference application for labs 04–10.
- Git **2.30+**, with `user.name` / `user.email` configured.

---

## Readiness checklist

Check before chapter 01:

- [ ] GitLab opens in the browser without a 502
- [ ] Login as `root` succeeds
- [ ] `gitlab-ctl status` — services are `run`
- [ ] Runner is **online** with tag `docker` (or you'll register it in lab 06)
- [ ] `git --version` ≥ 2.30
- [ ] You've read [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md)
- [ ] You know the path to `examples/hello-ci/`

Next lesson: [01-git-workflow.md](01-git-workflow.md).
