# 08. Artifacts and cache

## Intro: a real-world scenario

The build job produced a `.whl`, and the test job in the next stage: `FileNotFoundError: out/*.whl`. The cause: they forgot `artifacts: paths`. A second case: the pipeline takes 25 minutes — every time it runs `pip install` from scratch; a colleague added a **cache** and the time dropped to 8 minutes, but after changing `requirements.txt` the tests fail on stale packages — the **cache key** doesn't account for the lockfile. A third: artifacts took up 40 GB on the GitLab disk — there was no `expire_in`.

Artifacts and cache solve **different** problems; confusing them is a common mistake in interviews and in prod.

## What you'll learn

- **Artifacts** — passing files between jobs and downloading from the UI.
- **Cache** — speeding up repeated pipelines (best-effort).
- `dependencies`, `needs`, `expire_in`, `reports`.
- A comparison table: artifacts vs cache.
- Common anti-patterns.

---

## Artifacts: why

**Artifacts** are files that GitLab **saves** after a job and hands over:

- to the next jobs in the pipeline;
- to the user via the UI (Download).

```yaml
build:
  stage: build
  script:
    - python -m build --wheel
    - mkdir -p out && cp dist/*.whl out/
  artifacts:
    paths:
      - out/
    expire_in: 1 week
```

```yaml
install-wheel:
  stage: test
  dependencies:
    - build
  script:
    - pip install out/*.whl
    - python -c "import app; print(app.hello())"
```

Without `artifacts`, the `out/` directory **disappears** after the job's container finishes.

---

## `artifacts` keys

```yaml
artifacts:
  paths:
    - out/
    - reports/
  exclude:
    - out/temp/
  expire_in: 1 week
  when: on_success          # default; on_failure, always
  name: "$CI_JOB_NAME-$CI_COMMIT_REF_NAME"
  reports:
    junit: report.xml
    coverage_report:
      coverage_format: cobertura
      path: coverage.xml
```

| Key | Purpose |
|------|------------|
| `paths` | what to save (globs) |
| `expire_in` | TTL (`1 day`, `1 week`, `never`) |
| `when` | at which job status to save |
| `reports` | junit, coverage — UI Tests/Coverage |
| `name` | the zip name when downloading |

### `expire_in` and disk

On a busy instance, artifacts without a TTL fill up storage. For learning `.whl`s, `1 day` is enough. Prod binaries — a policy per compliance.

---

## `dependencies` and artifact inheritance

By default a job **downloads the artifacts of all** previous stages (this can be heavy).

```yaml
install-wheel:
  dependencies:
    - build    # only from the build job
```

A job without `dependencies` and without `dependencies: []` — the behavior depends on the GitLab version: check the docs; an explicit list is clearer.

### `needs` (DAG, preview)

Parallel stages with a job-to-job dependency:

```yaml
test-fast:
  needs: ["build"]
```

It speeds up the pipeline by not waiting for the whole stage — [`gitlab-intermediate`](../gitlab-intermediate/README.md).

---

## Cache: speeding up repeated runs

**Cache** is a best-effort restoration of directories between pipelines **of the same project** (often the same branch).

```yaml
test:
  cache:
    key: "$CI_COMMIT_REF_SLUG"
    paths:
      - .cache/pip
  script:
    - pip install -r requirements.txt --cache-dir .cache/pip
    - pytest
```

| Parameter | Meaning |
|----------|-------|
| `key` | the cache identifier; changing the key = a new cache |
| `paths` | what to archive |
| `policy` | `pull`, `push`, `pull-push` |

### Cache key strategies

| Key | When |
|-----|-------|
| `$CI_COMMIT_REF_SLUG` | a separate cache per branch |
| `files: [requirements.txt]` | invalidation when deps change |
| a fixed `pip-global` | a shared cache (risk of incompatibility) |

Recommendation:

```yaml
cache:
  key:
    files:
      - requirements-dev.txt
  paths:
    - .cache/pip
```

---

## Artifacts vs Cache

| | **Artifacts** | **Cache** |
|---|---------------|-----------|
| Reliability | guaranteed transfer within a pipeline | best-effort, may miss |
| Download from the UI | yes | no |
| Between pipelines | via the artifacts API / expire | yes, the same key |
| Size limits | instance limits | runner/admin limits |
| Use case | build output, reports | `.cache/pip`, `node_modules` |

**Don't cache** as cache what a subsequent job needs **for sure** — use **artifacts**.

---

## Reports: JUnit and Coverage

```yaml
unit:
  stage: test
  script:
    - pip install pytest
    - pytest --junitxml=report.xml
  artifacts:
    reports:
      junit: report.xml
    paths:
      - report.xml
    expire_in: 1 week
```

In the MR → the **Tests** tab — failed tests without reading the full log.

Coverage (Cobertura XML) — a coverage widget in the MR (thresholds — in the settings).

Connection to quality gates and **Change Failure Rate**: tests are visible to the reviewer before the merge.

---

## Artifacts on failure

```yaml
debug:
  script:
    - ./flaky-test.sh
  artifacts:
    when: on_failure
    paths:
      - logs/
      - screenshots/
    expire_in: 3 days
```

You keep the context for debugging flaky tests — not on every success (saving space).

---

## Common mistakes

| Mistake | Symptom | Solution |
|--------|---------|---------|
| No `artifacts.paths` | the next job can't see the files | add paths |
| Huge artifact (the entire `node_modules`) | slow upload, disk | only dist/out |
| Cache without a key from the lockfile | stale deps | `key: files:` |
| Confusing cache with artifacts | nondeterministic test | artifacts for build output |
| `expire_in: never` everywhere | disk full | a TTL policy |
| Wrong `dependencies` job | missing file | an explicit list of job names |

---

## Summary

- **Artifacts** — the official way to pass build/test results between jobs.
- **Cache** — an accelerator; it can go stale — design the key.
- **`expire_in`** — storage hygiene.
- **`reports: junit`** — UX for review and DORA quality.
- Explicit **`dependencies`** — control over what a job downloads.

---

## Checklist

- [ ] Artifacts vs cache — what's the difference?
- [ ] Why `expire_in`?
- [ ] When `reports: junit`?
- [ ] Why a cache key from the branch?
- [ ] What does `dependencies: [build]` do?
- [ ] When `when: on_failure` for artifacts?

Next lesson: [09-lab-artifacts.md](09-lab-artifacts.md).
