# 06. Lab: Docker runner

## Intro: a real-world scenario

After lab 04 the pipeline is still **pending**. You open **Settings → CI/CD → Runners** — the list is empty or shows a gray **offline**. DevOps: "Register a project runner, tag docker, verify `docker info` from a job." Twenty minutes later the runner is green, but a job with `image: docker:24-cli` fails: `Cannot connect to the Docker daemon` — the socket isn't mounted. Another case: re-registering with the wrong `--url` — the runner is in the UI but doesn't pick up jobs.

This lab reinforces [05-runners.md](05-runners.md) on the [`deploy/gitlab`](../../deploy/gitlab/README.md) environment.

## What you'll do

- Check the runner status in the UI.
- Add a job with an explicit `tags: [docker]` and `docker info`.
- If needed, **re-register** the runner.
- (Preview) a job with **services** — a sidecar Postgres.

**Time:** ~45–75 minutes.

---

## Task 1. Check the runner in the UI

1. Open the `hello-ci` project at [http://localhost:8929](http://localhost:8929).
2. **Settings → CI/CD → Runners** → Expand.
3. The **Project runners** section (or **Assigned project runners**).

Expected:

| Field | Value |
|------|----------|
| Status | **green** / online |
| Tags | `docker`, `local` (as in the environment README) |
| Executor | docker |

If there are **no runners** — Task 3.

Check from the host:

```bash
docker ps --filter name=mock-gitlab-runner
docker exec mock-gitlab-runner gitlab-runner list
```

---

## Task 2. A job with tags and the Docker CLI

Add to `.gitlab-ci.yml` (stage `test`):

```yaml
docker-info:
  stage: test
  tags:
    - docker
  image: docker:24-cli
  script:
    - docker version
    - docker info
    - uname -a
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

```bash
git checkout -b lab/docker-runner
git add .gitlab-ci.yml
git commit -m "ci(runner): verify docker executor with docker-info job"
git push -u origin lab/docker-runner
```

Create an MR → wait for the pipeline.

**Success:** the `docker-info` job is **passed**, and the log shows the Docker Server Version, OS/Arch.

**Pending:** the runner is offline or lacks the `docker` tag — Task 3.

**Failed `Cannot connect to Docker daemon`:** on the learning compose the socket is usually mounted; check the runner's `config.toml` (the `/var/run/docker.sock` volume).

---

## Task 3. Registering a runner

If the runner is missing or offline:

1. **Settings → CI/CD → Runners → New project runner**.
2. Tags: `docker`, `local`.
3. Run untagged jobs: optional (the course uses tags).
4. Copy the **registration token** (in newer versions it's a one-time format — an authentication token).

```bash
docker exec -it mock-gitlab-runner gitlab-runner register \
  --url http://gitlab \
  --token YOUR_PROJECT_RUNNER_TOKEN \
  --executor docker \
  --docker-image alpine:latest \
  --description "course-docker" \
  --tag-list "docker,local" \
  --non-interactive \
  --docker-network-mode host
```

| Parameter | Why |
|----------|-------|
| `--url http://gitlab` | the service name in the compose docker network |
| `--executor docker` | jobs in containers |
| `--tag-list` | matches `tags:` in the YAML |
| `--docker-network-mode host` | access to host services (Windows/macOS nuances) |

Refresh the Runners page — **online**.

Restart the pipeline: **CI/CD → Pipelines → Retry**.

### Unregister (if there are duplicates)

```bash
docker exec mock-gitlab-runner gitlab-runner unregister --all-runners
```

Then register again (be careful in a shared environment).

---

## Task 4. Services — a sidecar (preview)

Integration tests with a DB — a pattern for [`gitlab-intermediate`](../gitlab-intermediate/README.md). Add an experimental job:

```yaml
integration-preview:
  stage: test
  tags:
    - docker
  image: python:3.12-slim
  services:
    - name: postgres:16-alpine
      alias: db
  variables:
    POSTGRES_DB: test
    POSTGRES_USER: test
    POSTGRES_PASSWORD: test
    POSTGRES_HOST_AUTH_METHOD: trust
  script:
    - pip install psycopg2-binary
    - python -c "import psycopg2; c=psycopg2.connect(host='db',dbname='test',user='test'); print('ok')"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  allow_failure: true
```

GitLab brings up a **second** container in the job's network; the service's hostname is **`db`** (the alias).

On low RAM the job may pull postgres slowly — `allow_failure: true` keeps it from breaking the MR.

---

## Task 5 (bonus). Diagnosing pending

Create a job:

```yaml
needs-gpu:
  stage: test
  tags:
    - gpu
  script:
    - echo "never runs on course runner"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
  allow_failure: true
```

Confirm: the job is **pending** indefinitely (no runner with `gpu`). Remove the job after the demo — otherwise the pipeline "hangs" on pending (or cancel the job manually).

**Lesson:** a typo in a tag = a queue with no executor.

---

## Success criteria

- [ ] Runner is **online** in Settings
- [ ] Job `docker-info` is **passed**
- [ ] The log has `docker info` output with no daemon error
- [ ] You understand the difference between pending (no runner) and failed (script error)

---

## If something went wrong

| Symptom | Cause | Action |
|---------|---------|----------|
| Register: 401 | wrong token | a new runner in the UI |
| Register: connection refused | wrong url | `http://gitlab` from the runner container |
| Runner online, job pending | tag mismatch | `docker` on the job and the runner |
| `docker: not found` | image without the CLI | `image: docker:24-cli` |
| Postgres service fail | pull timeout / RAM | retry, `allow_failure` |
| Two runners, strange executor | an old registration | unregister the extra ones |

---

## Summary

The runner is the operational component of CI. Being able to **register** it, **check the tags**, and **read the docker-info log** is a basic on-call skill.

---

## Checklist

- [ ] Where do you get the registration token?
- [ ] Which `--url` inside compose?
- [ ] Why `services` and `alias: db`?
- [ ] What happens with `tags: [gpu]` on the course runner?

Next lesson: [07-variables-secrets.md](07-variables-secrets.md).
