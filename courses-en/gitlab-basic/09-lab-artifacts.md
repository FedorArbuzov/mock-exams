# 09. Lab: artifacts between jobs

## Intro: a real-world scenario

Release engineer: "The build job publishes a wheel, the QA job installs it with pip install — no manual copying." You add `package` to the `build` stage and `install-wheel` to `test`, but you forgot the `stages:` order — `test` ran **before** `build` (if you mixed up the order in the stages list). A second time: `install-wheel` downloaded the artifacts of **all** jobs including a huge log — you specified `dependencies: [package]`. A third: a second pipeline on the same branch — the **pip cache** cut the time from 4 min to 90 sec.

This lab implements the **build once, test consume** pattern — the basis of a release pipeline.

## What you'll do

- A `package` job with a wheel as an **artifact**.
- An `install-wheel` job with `dependencies`.
- A shared **pip cache** across two jobs.
- (Bonus) a JUnit report in the MR Tests tab.

**Time:** ~60–90 minutes.

---

## Preparation

- Project `hello-ci` on `:8929`, runner online.
- The basic pipeline from [04-lab-first-pipeline.md](04-lab-first-pipeline.md).
- A `pyproject.toml` with build support (already present in `examples/hello-ci`).

---

## Task 1. Stages build → test

Update the beginning of `.gitlab-ci.yml`:

```yaml
stages:
  - build
  - test

default:
  image: python:3.12-slim
  tags:
    - docker
  cache:
    key:
      files:
        - requirements-dev.txt
    paths:
      - .cache/pip
```

The order in `stages` **determines** the sequence: first all `build` jobs, then `test`.

---

## Task 2. Build job with artifacts

```yaml
package:
  stage: build
  script:
    - pip install build --cache-dir .cache/pip
    - python -m build --wheel
    - mkdir -p out && cp dist/*.whl out/
    - ls -la out/
  artifacts:
    paths:
      - out/
    expire_in: 1 day
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Local check (optional):

```bash
pip install build
python -m build --wheel
ls dist/
```

---

## Task 3. Consume job

```yaml
install-wheel:
  stage: test
  dependencies:
    - package
  script:
    - pip install out/*.whl --cache-dir .cache/pip
    - python -c "from app import hello; print(hello())"
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Keep the existing `lint` and `unit` in the `test` stage — they'll run **in parallel** with `install-wheel` after `package` succeeds.

Expected graph:

```text
build:  [package]
           ↓
test:   [lint] [unit] [install-wheel]
```

---

## Task 4. Check in the UI

```bash
git checkout -b lab/artifacts
git add .gitlab-ci.yml
git commit -m "ci(artifacts): package wheel and install in downstream job"
git push -u origin lab/artifacts
```

MR → pipeline:

1. The `package` job is **passed**; in the job sidebar **Job artifacts** → Browse/Download `out/*.whl`.
2. The `install-wheel` job — the `hello()` output from the application.
3. **Pipeline → Download artifacts** — a zip of all the pipeline's artifacts.

If `install-wheel` fails with `No matching distribution`:

- `package` didn't produce the whl (check the `package` log);
- wrong `dependencies`;
- `out/` isn't in the artifacts paths.

---

## Task 5. pip cache

Run the pipeline **twice** on the same branch (an empty commit or Retry):

```bash
git commit --allow-empty -m "ci: retry for cache demo"
git push
```

Compare the time of the `package` / `unit` jobs — the `pip install` step should be faster on a cache hit (in the log: `Checking cache for ... successfully extracted`).

If the cache misses every time:

- different runners without a shared cache;
- `requirements-dev.txt` changed (the key changed);
- on a learning single runner it usually works.

---

## Task 6 (bonus). JUnit report

In the `unit` job:

```yaml
unit:
  stage: test
  script:
    - pip install pytest --cache-dir .cache/pip
    - pip install -e . --cache-dir .cache/pip
    - pytest tests/ -v --junitxml=report.xml
  artifacts:
    reports:
      junit: report.xml
    paths:
      - report.xml
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

MR → **Tests** — a list of test cases. Break a test — you'll see the failed test in the UI without grepping the log.

---

## Success criteria

- [ ] `install-wheel` sees the `.whl` from `package`
- [ ] Artifacts download from the pipeline UI
- [ ] Cache speeds up a repeated run (subjectively or by the log)
- [ ] Stages: `build` before `test`
- [ ] (Bonus) Tests tab in the MR

---

## If something went wrong

| Symptom | Cause | Action |
|---------|---------|----------|
| `test` before `build` | the `stages` order | `build` first |
| Empty `out/` | build failed | log `python -m build` |
| install can't find the whl | no artifacts | paths, job name |
| Extra files downloaded | default dependencies | `dependencies: [package]` |
| Tests tab empty | no `reports: junit` | the bonus task |
| Cache always misses | key/files | check the requirements path |

---

## Summary

You've assembled a **mini-release pipeline**: a build artifact → consumption in test. Docker images (intermediate), terraform plans, and coverage reports are passed the same way.

---

## Checklist

- [ ] Why is `package` in a separate stage?
- [ ] What would happen without `dependencies`?
- [ ] Artifacts vs cache in this lab — what goes where?

Next lesson: [10-final-project.md](10-final-project.md).
