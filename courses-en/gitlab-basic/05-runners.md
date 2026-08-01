# 05. Runners: types and executors

## Intro: a real-world scenario

Monday, 09:15. In Slack: "All pipelines have been pending since Friday." Turns out the VM with the runner rebooted, and **gitlab-runner** wasn't in autostart. A second case: a job with `tags: [gpu]` hangs forever — the project only has runners with `docker`. A third: a security audit — the docker executor with `/var/run/docker.sock` on a shared VM: "any job can mount the host." In the course you learn to **diagnose pending** and understand the trade-offs; in production — isolation, separate runner fleets ([`gitlab-advanced`](../gitlab-advanced/README.md)).

The **GitLab Server** (your CE on `:8929`) **does not run** the `script` of jobs — it only plans. The **Runner** runs them.

## What you'll learn

- The architecture: GitLab → queue → Runner → executor.
- Runner types: shared, group, project.
- Executors: **docker**, shell, kubernetes (overview).
- **Tags** and why a job is pending.
- Concurrency and the queue.
- docker+socket security (briefly).

---

## Architecture

```text
┌─────────────────┐     job request      ┌──────────────────┐
│  GitLab CE      │ ──────────────────► │  GitLab Runner   │
│  :8929          │ ◄────────────────── │  (agent)         │
│  UI, Git, CI    │     job result       │  docker/shell/k8s│
└─────────────────┘                      └──────────────────┘
```

1. Push/MR → GitLab creates a **pipeline** and **jobs**.
2. Jobs with status **pending** wait for a runner.
3. A runner with matching **tags** and **executor** picks up the job.
4. `before_script` + `script` run in the executor's environment.
5. The log streams to GitLab; status is success/failed.

If the runner is offline, all jobs **get stuck**. This is not a YAML bug.

---

## Runner types

| Type | Scope | When |
|-----|---------|-------|
| **Instance** (shared) | the whole GitLab | a shared pool across the company |
| **Group** | the group's projects | the platform team |
| **Project** | one project | isolation, its own tags |

In the mock-exams course: a **project runner** in `hello-ci` with tags `docker`, `local` — see [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md).

Registration binds the runner to a project/group/instance token. **Unregister** — the runner disappears from the UI, jobs go pending.

---

## Executors

| Executor | Where the job runs | Pros | Cons |
|----------|---------------------|-------|--------|
| **docker** | a container on the runner host | isolation, any `image` | Docker required, socket risks |
| **shell** | directly on the runner VM | simple, quick to start | no isolation, a "dirty" VM |
| **kubernetes** | a pod in the cluster | scale, [`kuber-basic`](../kuber-basic/README.md) | more complex setup |
| **custom** | rarely | special environments | — |

The **basic/intermediate** course uses the **docker executor** + the images `python:3.12-slim`, `docker:24-cli`.

### Docker executor (what it looks like)

```text
Runner → docker pull python:3.12-slim
      → docker run ... gitlab-runner-helper + your repo checkout
      → script inside the container
      → container destroy
```

Each job gets a **clean** file system (except cache/artifacts volumes).

---

## Tags: routing jobs

In `.gitlab-ci.yml`:

```yaml
build:
  tags:
    - docker
  script:
    - echo "Runs only on runners with tag docker"
```

At registration, a runner gets `--tag-list "docker,local"`.

| Situation | Result |
|----------|-----------|
| Job `tags: [docker]`, runner `docker` | match |
| Job `tags: [docker, amd64]`, runner only `docker` | **no match** — pending |
| Job without `tags` | any **untagged** runner (the "run untagged" setting) |
| Multiple runners | the first free one that matches |

In the course, **always** specify `tags: [docker]` in jobs — otherwise a job might go to the wrong runner.

---

## Job states (diagnostics)

| Status | Meaning |
|--------|----------|
| **pending** | no runner / no tags / queue |
| **running** | a runner is executing it |
| **success** | exit 0 |
| **failed** | nonzero exit / script error |
| **canceled** | user / auto-cancel |

**CI/CD → Pipelines → job →** the runner icon shows which agent took the job.

---

## Concurrency

In `/etc/gitlab-runner/config.toml` on the runner host:

```toml
concurrent = 4
```

A maximum of **4 jobs at once** on this runner process. A fifth job waits in pending.

For a class of 20 students on one laptop, this is a bottleneck. Solutions: a higher `concurrent`, several runner VMs, lightweight jobs, cache.

---

## Runner config (overview)

After registration, in the `mock-gitlab-runner` container:

```bash
docker exec mock-gitlab-runner cat /etc/gitlab-runner/config.toml
```

A fragment:

```toml
[[runners]]
  name = "local-docker"
  url = "http://gitlab"
  executor = "docker"
  [runners.docker]
    image = "alpine:latest"
    volumes = ["/var/run/docker.sock:/var/run/docker.sock", "/cache"]
```

| Field | Meaning |
|------|-------|
| `url` | the GitLab API (in compose — `http://gitlab`) |
| `executor` | docker / shell / kubernetes |
| `image` | default, if the job has no `image` |
| `volumes` | the socket for docker-in-docker build (intermediate) |

---

## Security (briefly)

**The Docker socket on the host** = root on the host from a malicious job. In production:

- separate runner VMs per trust zone;
- **Kaniko**, **buildah** without the socket;
- a **kubernetes executor** with pod security;
- don't give Developers access to a shared runner with production secrets.

On the learning `:8929`, the risk is acceptable; the **habit** is not to store prod secrets on the same runner.

---

## Runner vs GitLab server

| | GitLab CE | Runner |
|---|-----------|--------|
| Role | Git, UI, CI planner | executing jobs |
| Scale | heavy (RAM) | lighter, can have many |
| Where in compose | `mock-gitlab` | `mock-gitlab-runner` |
| Without it | push works | jobs pending |

You can have **one GitLab** and **dozens of runners** in different networks (on-prem, cloud).

---

## Common mistakes

| Mistake | Symptom | Solution |
|--------|---------|---------|
| Runner stopped | everything pending | `docker start mock-gitlab-runner` |
| Wrong registration token | register fail | a new token in the UI |
| Tag mismatch | one job pending | align the job/runner tags |
| `url` http vs https | register/run fail | as in compose |
| Forgot `--tag-list` | job with docker tag pending | re-register |
| One concurrent, 10 jobs | a long queue | wait or increase it |

---

## Summary

- The runner is the **only** executor of jobs; an offline runner = a **pending pipeline**.
- A **project runner** with tag `docker` is the course standard.
- The **docker executor** runs the `image` per job.
- **Tags** — explicit routing; the job and runner must match.
- Sockets and shared runners are a security concern in prod.

---

## Checklist

- [ ] Runner vs GitLab server — who does what?
- [ ] Why tags on a job and a runner?
- [ ] Why does a job hang in pending (3 causes)?
- [ ] Shell vs docker executor — the trade-off?
- [ ] Where in the UI is a runner's status?
- [ ] What is `concurrent`?

Next lesson: [06-lab-docker-runner.md](06-lab-docker-runner.md).
