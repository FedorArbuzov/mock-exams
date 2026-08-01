# GitLab DevOps — Basic

> **Prefer the single track [`gitlab-cicd`](../gitlab-cicd/README.md)** after `kuber-basic`. This course remains a slower deep-dive on Git + first pipelines.

An in-depth course on **Git** and **GitLab CI/CD** for engineers building their first pipeline "from commit to green job." **12 lessons** (00–11) + an interview cheatsheet. The goal is to work confidently with MRs, `.gitlab-ci.yml`, runners, variables, and artifacts — and never commit secrets to Git.

> Start of the DevOps track: [`devops-path.md`](../devops-path.md). **Prerequisites** — basic Git (clone, commit, push) and Docker. Next up — [`gitlab-intermediate`](../gitlab-intermediate/README.md) (registry, build/push, deploy), [`gitlab-advanced`](../gitlab-advanced/README.md) (K8s runner, GitOps). Culture and DORA: [`devops-culture`](../devops-culture/README.md).

**Local environment:** GitLab CE in Docker — [`deploy/gitlab`](../../deploy/gitlab/README.md), URL **[http://localhost:8929](http://localhost:8929)**. Example application: [`examples/hello-ci/`](examples/hello-ci/).

```bash
# from the mock-exams root
docker compose -f deploy/gitlab/docker-compose.yml up -d
docker exec mock-gitlab gitlab-ctl status   # wait for healthy
# root password — see deploy/gitlab/README.md
```

## How to read the chapters

Each lesson is a **full textbook chapter**, not a cheat sheet. The author moves from a **real-world scenario** (pipeline stuck in pending, runner offline, a secret leaked into a log, an MR without review) to concepts, YAML, commands, and common mistakes — as in [`javascript-basic`](../javascript-basic/README.md) and [`nodejs-basic`](../nodejs-basic/README.md).

1. **Theory** — "Real-world scenario" → "What you'll learn" → detailed content → code examples → "Common mistakes" → "Summary" → "Checklist." Reinforce the checklist **in your own words** before the lab.
2. **Lab** (chapters 04, 06, 09, 10) — hands-on on local GitLab `:8929`: push, MR, pipeline, runner. The "if something went wrong" table is at the end of the lab.
3. After chapter 10 — [`interview-cheatsheet.md`](interview-cheatsheet.md) **without peeking** at the chapters.
4. [11-interview-qa.md](11-interview-qa.md) — a breakdown of 20+ questions with references to the lessons.

**Time:** **~45–60 minutes** per "theory + lab" pair (where there is a lab). The whole course — **~10–14 hours**; the final project (chapter 10) — **2–3 hours** separately.

## Requirements

| Tool | Version / note |
|---|---|
| Git | 2.30+ (`git --version`) |
| Docker | Compose v2, **4+ GB RAM** for GitLab CE |
| Text editor | YAML with highlighting (an indentation error = failed pipeline) |
| OS | Windows / macOS / Linux — the course is verified on `localhost:8929` |

Kubernetes is **not required** at the basic level. Deploying to a cluster — [`kuber-basic`](../kuber-basic/README.md) and [`gitlab-intermediate`](../gitlab-intermediate/README.md).

## Curriculum (12 lessons, 00–11)

### Phase 0. Environment (00)

| # | Lesson |
|---|------|
| 00 | [Environment: GitLab CE, runner, hello-ci](00-environment.md) |

### Phase 1. Git and the GitLab UI (01–02)

| 01 | [Git: branches, MRs, good commits](01-git-workflow.md) |
| 02 | [GitLab: project, issues, Merge Request](02-gitlab-intro.md) |

### Phase 2. CI/CD basics (03–04)

| 03 | [`.gitlab-ci.yml`: stages, jobs, image](03-gitlab-ci-yaml.md) |
| 04 | [Lab: first pipeline](04-lab-first-pipeline.md) |

### Phase 3. Runners (05–06)

| 05 | [Runners: types and executors](05-runners.md) |
| 06 | [Lab: Docker runner](06-lab-docker-runner.md) |

### Phase 4. Variables, artifacts (07–09)

| 07 | [Variables and masked secrets](07-variables-secrets.md) |
| 08 | [Artifacts and cache](08-artifacts-cache.md) |
| 09 | [Lab: artifacts between jobs](09-lab-artifacts.md) |

### Phase 5. Finale and interview (10–11)

| 10 | [Final project: CI for a demo application](10-final-project.md) |
| 11 | [Interview Q&A: GitLab CI basics](11-interview-qa.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- You bring up **GitLab CE** on `:8929`, log in as `root`, and register a **project runner** with the `docker` tag.
- You create an **MR** with a meaningful description and **Conventional Commits**; you understand what triggers a pipeline.
- You write a `.gitlab-ci.yml` with the stages `test` → `build`, plus `rules`, `image`, and `tags`.
- You diagnose a **pending job** (no runner / wrong tag) and a **failed job** (log, YAML).
- You store secrets in **CI variables** (masked/protected), not in Git; you know about `CI_JOB_TOKEN`.
- You pass **artifacts** between jobs, speed up the pipeline with **cache**, and distinguish artifacts from cache.
- You connect CI to **DORA** (deployment frequency, lead time) from [`devops-culture`](../devops-culture/03-dora-metrics.md).

## Related courses

| Course | Connection |
|---|---|
| [`devops-culture`](../devops-culture/README.md) | DORA, culture, why CI/CD matters to an organization |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | Docker build, registry, `mockctl` deploy |
| [`gitlab-advanced`](../gitlab-advanced/README.md) | K8s executor, Helm runner |
| [`kuber-basic`](../kuber-basic/README.md) | a cluster for deploy (later) |
| [`secrets-basic`](../secrets-basic/README.md) | Vault in CI instead of variables alone |
| [`aws-terraform`](../aws-terraform/README.md) | `terraform plan` in a pipeline (intermediate) |

Map of the DevOps tracks: [`courses/README.md`](../README.md).
