# GitLab Basic — interview cheatsheet

Test yourself **without peeking** at chapters 00–10, then open the breakdowns in [11-interview-qa.md](11-interview-qa.md).

---

## Git + MR

| Concept | Essence |
|---------|------|
| Trunk-based | short feature branches → frequent merges into `main` |
| MR | review + CI before merge; `Closes #N` |
| Protected branch | pushing to `main` forbidden; pipeline must succeed |
| Conventional Commits | `feat(scope): subject` — changelog, automation |

**CI triggers:** push, `merge_request_event`, tag, schedule — depends on `rules`.

---

## CI architecture

```text
push/MR → GitLab (planner) → jobs pending → Runner (executor) → success/fail
```

| Component | Role |
|-----------|------|
| GitLab CE | Git, UI, parsing `.gitlab-ci.yml` |
| Runner | runs the `script`; without it — **pending** |
| `image` | the job's Docker image (docker executor) |

Local environment: **http://localhost:8929** — [`deploy/gitlab`](../../deploy/gitlab/README.md).

---

## `.gitlab-ci.yml`

```yaml
stages: [test, build]    # stages run sequentially; jobs in a stage — in parallel

job-name:
  stage: test
  image: python:3.12-slim
  tags: [docker]
  script: [...]
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

| Key | Why |
|------|-------|
| `before_script` | deps, login |
| `after_script` | cleanup (always) |
| `rules` | when a job is in the pipeline |
| `extends` | DRY templates |
| `allow_failure: true` | red job, green pipeline |

**Predefined:** `CI_COMMIT_BRANCH`, `CI_COMMIT_SHA`, `CI_JOB_NAME`, `CI_PIPELINE_SOURCE`, `CI_JOB_TOKEN`, `CI_REGISTRY`.

---

## Runners

| Type | Scope |
|-----|---------|
| Instance | the whole GitLab |
| Group | a group of projects |
| Project | one project |

| Executor | Environment |
|----------|-------|
| docker | a container (`image`) |
| shell | the runner VM directly |
| kubernetes | a pod ([`kuber-basic`](../kuber-basic/README.md)) |

**Tags:** job `tags` ∩ runner tags — otherwise **pending**.

**Security:** the docker socket = root on the host; isolate the runner VM.

---

## Variables

| Level | Where |
|---------|-----|
| Project | Settings → CI/CD → Variables |
| Group | Group → CI/CD → Variables |

| Flag | Effect |
|------|--------|
| Mask | hide in the log (not 100%; length ≥ 8) |
| Protect | only protected branches |
| File | value → a temporary file `$VAR` |

**Never** put secrets in Git. Vault: [`secrets-basic`](../secrets-basic/README.md).

---

## Artifacts vs Cache

| | Artifacts | Cache |
|---|-----------|-------|
| Purpose | pass files between jobs | speed up a repeated pipeline |
| Reliability | high | best-effort |
| UI download | yes | no |
| TTL | `expire_in` | key + policy |

```yaml
artifacts:
  paths: [out/]
  reports:
    junit: report.xml
dependencies: [build]   # where to download artifacts from
```

```yaml
cache:
  key:
    files: [requirements.txt]
  paths: [.cache/pip]
```

---

## Diagnostics

| Symptom | Common cause |
|---------|----------------|
| No pipeline | no `.gitlab-ci.yml`, CI off |
| Pending | runner offline / tag mismatch |
| Failed | script exit ≠ 0, no `image` |
| Job absent | `rules` didn't match |
| YAML error | tabs, Validate in the Editor |

Log: **CI/CD → Pipelines → job → Trace**.

---

## DORA (connection)

| Metric | How CI helps |
|---------|-------------|
| Deployment Frequency | frequent MRs + green pipeline |
| Lead Time for Changes | fast lint/test feedback |
| Change Failure Rate | tests before merge |
| MTTR | artifacts/logs on failure |

More: [`devops-culture/03-dora-metrics`](../devops-culture/03-dora-metrics.md).

---

## Next level

| Course | Topic |
|------|------|
| `gitlab-intermediate` | docker build, registry, deploy |
| `gitlab-advanced` | K8s runner, GitOps |
| `kuber-basic` | a cluster |

---

## Quick check before the interview

- [ ] Runner vs GitLab server
- [ ] `rules` vs `only`
- [ ] Artifacts vs cache
- [ ] Masked variables — limitations
- [ ] Why a job is pending
- [ ] Stages vs parallel jobs
- [ ] `CI_JOB_TOKEN` — why
- [ ] Protected branch + MR workflow
