# 04. Lab: first pipeline

## Intro: a real-world scenario

Thursday, the "green CI by 15:00" deadline. You copied `hello-ci`, added a `.gitlab-ci.yml`, and pushed — but there's **no pipeline** in the UI. Turns out the file was named `gitlab-ci.yaml` (not `.yml`). You fixed it — now there's a pipeline, but both jobs are **pending** for 40 minutes: the runner is offline. After registering the runner — `lint` is green, `unit` is red: `ModuleNotFoundError: app`. The import path and `pip install -e .` are the lab's topic. Team lead: "Break a test on purpose — make sure the MR blocks the merge."

Hands-on practice at [http://localhost:8929](http://localhost:8929) reinforces chapters 01–03.

## What you'll do

- Copy [`examples/hello-ci/`](examples/hello-ci/) into a GitLab project.
- Write a `.gitlab-ci.yml` with `lint` and `unit` jobs.
- Open an **MR** and get a green pipeline.
- Deliberately break a test and fix it — you'll see failed → passed.

**Time:** ~60–90 minutes including waiting on GitLab/runner.

---

## Preparation

Checklist from [00-environment.md](00-environment.md):

| # | Condition |
|---|---------|
| 1 | GitLab on `:8929` healthy |
| 2 | Project `hello-ci` created (or you create it now) |
| 3 | Runner online, tag `docker` |
| 4 | Git configured |

If you don't have a runner yet — register it per [`deploy/gitlab/README.md`](../../deploy/gitlab/README.md) or defer it to [06-lab-docker-runner.md](06-lab-docker-runner.md), but the pipeline won't run without a runner.

---

## Task 1. Copy the demo application

### Option A: from mock-exams

```bash
# Windows PowerShell — copy the directory manually or:
cp -r courses/gitlab-basic/examples/hello-ci/* /path/to/your/hello-ci/
cd /path/to/your/hello-ci
```

### Option B: git init + remote

```bash
cd /path/to/your/hello-ci
git init
git remote add origin http://localhost:8929/root/hello-ci.git
```

The structure should match [examples/hello-ci/](examples/hello-ci/):

```text
hello-ci/
├── app/__init__.py
├── tests/test_app.py
├── pyproject.toml
└── requirements-dev.txt
```

Local check (optional):

```bash
pip install -r requirements-dev.txt
pytest tests/ -v
ruff check app/ tests/
```

---

## Task 2. Create the `.gitlab-ci.yml`

Create the file in the **root** of the repository:

```yaml
stages:
  - test

default:
  image: python:3.12-slim
  tags:
    - docker

lint:
  stage: test
  script:
    - pip install ruff
    - ruff check app/ tests/

unit:
  stage: test
  script:
    - pip install pytest
    - pip install -e .
    - pytest tests/ -v
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

**Notes:**

- `default.tags: [docker]` — the course runner.
- `pip install -e .` — the `app` package becomes available to pytest (from `pyproject.toml`).
- `rules` on `unit` — the same pattern as in prod: MR + main.

YAML check: **CI/CD → Editor → Validate** (paste the content before pushing).

---

## Task 3. Push and a Merge Request

```bash
git checkout -b feature/ci
git add .
git commit -m "feat(ci): add lint and unit test jobs"
git push -u origin feature/ci
```

In GitLab:

1. A **Create merge request** banner appears — click it.
2. Target: `main`, title: like the commit.
3. Description: `Closes #1` (if you opened an issue).

**CI/CD → Pipelines** — the pipeline on the source branch / MR.

Expected view:

```text
Stage: test
  ├── lint   (running → passed)
  └── unit   (running → passed)
```

Jobs in the same stage run **in parallel** (two runner slots or a queue).

---

## Task 4. Break and fix a test

In `tests/test_app.py`, temporarily:

```python
def test_hello():
    assert False, "intentional break for CI demo"
```

```bash
git add tests/test_app.py
git commit -m "test(ci): demonstrate failed pipeline"
git push
```

On the MR, the pipeline becomes **failed** (the `unit` job is red). Open the **job log** — you'll see the assertion error.

Fix the test back, push — the pipeline is **passed**. This is the cycle that lowers **Change Failure Rate** when CI is mandatory before a merge ([`devops-culture`](../devops-culture/03-dora-metrics.md)).

---

## Task 5 (bonus). Protected branch

**Settings → Repository → Protected branches** — protect `main`, require a successful pipeline. Try `git push origin main` from a feature branch — it should be rejected (if pushing is forbidden).

---

## Success criteria

- [ ] The pipeline on the MR is **green** after the final fix
- [ ] `lint` and `unit` in the `test` stage (parallel in the UI)
- [ ] You saw a **failed** pipeline after `assert False`
- [ ] You can open a job's **trace** and find the error
- [ ] The file is named exactly `.gitlab-ci.yml`

---

## If something went wrong

| Symptom | Likely cause | Action |
|---------|-------------------|----------|
| No pipeline | no file / CI off | check the file name, Settings |
| Pending forever | no runner | [05-runners.md](05-runners.md), register |
| `unsupported tag docker` | runner without the tag | add the tag at registration |
| `ruff: not found` | no pip install | see the YAML above |
| `No module named 'app'` | no editable install | `pip install -e .` |
| 403 on push | auth | PAT, root password |
| YAML invalid | tabs | spaces, Validate in the Editor |

---

## Summary

You've gone through the full cycle: **code → YAML → push → MR → pipeline → log**. This is the foundation of a platform/infrastructure engineer's daily work.

---

## Checklist

- [ ] Where in the UI is the list of pipelines for an MR?
- [ ] How many jobs are in the `test` stage and how do they run?
- [ ] What changed in the pipeline after the intentional failure?

Next lesson: [05-runners.md](05-runners.md).
