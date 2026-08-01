# 26. GitLab CI: pytest job, coverage report, artifacts

## Intro: "works on my machine — CI has no venv"

Locally pytest is green; CI uses the **system python** without deps. The pipeline must: install editable, run unit+cov, publish **coverage.xml**, fail on threshold.

## What you'll learn

- A **`.gitlab-ci.yml`** fragment for shop-lab.
- The **Coverage cobertura** artifact.
- **Split jobs** unit vs integration.
- The link to [`gitlab-basic`](../gitlab-basic/README.md).

---

## Minimal test job

```yaml
stages:
  - test

variables:
  PIP_CACHE_DIR: "$CI_PROJECT_DIR/.cache/pip"

pytest-unit:
  stage: test
  image: python:3.12-slim
  cache:
    paths:
      - .cache/pip
  before_script:
    - cd courses/python-testing/examples
    - pip install -e ".[dev]"
  script:
    - pytest tests/unit
        --cov=shop
        --cov-report=term-missing
        --cov-report=xml:coverage.xml
        --cov-fail-under=85
        -m "not slow"
  artifacts:
    when: always
    reports:
      coverage_report:
        coverage_format: cobertura
        path: courses/python-testing/examples/coverage.xml
```

Adjust paths if the repo root differs.

---

## Integration nightly

```yaml
pytest-integration:
  stage: test
  image: python:3.12-slim
  services:
    - name: docker:24-dind
      alias: docker
  variables:
    DOCKER_HOST: tcp://docker:2375
    RUN_INTEGRATION: "1"
  rules:
    - if: $CI_PIPELINE_SOURCE == "schedule"
  before_script:
    - cd deploy/python-async && docker compose up -d --build
    - cd ../../courses/python-testing/examples && pip install -e ".[dev]"
  script:
    - pytest tests/integration -v --tb=short
```

Nightly only — MR doesn't wait for docker.

---

## Parallel pytest (optional)

```yaml
script:
  - pip install pytest-xdist
  - pytest tests/unit -n auto --cov=shop
```

Watch the coverage combine — an advanced topic.

---

## Fail fast on MR

```yaml
pytest-unit:
  script:
    - pytest tests/unit -x --maxfail=3 --cov=shop --cov-fail-under=85
```

---

## Local simulation

```bash
docker run --rm -v "%cd%:/app" -w /app/courses/python-testing/examples python:3.12-slim \
  bash -c 'pip install -e ".[dev]" && pytest tests/unit --cov=shop --cov-fail-under=85'
```

---

## Security scan in parallel

With [`gitlab-advanced`](../gitlab-advanced/README.md): a test job + SAST run independently.

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| wrong working directory | ModuleNotFoundError | cd examples |
| no cov xml path | GitLab no report | --cov-report=xml |
| integration on MR | 20 min pipeline | rules: schedule |
| cache stale deps | weird fail | invalidate cache |

## Interview questions

- How to split unit/integration CI?
- Why a cobertura artifact?

## Summary

CI: python image, pip install -e .[dev], pytest unit + cov-fail-under. Integration scheduled with docker. coverage.xml for the GitLab UI.

Next: [27-flaky-debugging](27-flaky-debugging.md).
