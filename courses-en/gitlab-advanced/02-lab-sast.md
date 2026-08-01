# 02. Lab: SAST and secret detection

## Real-world scenario

A security engineer joins the platform team's onboarding: "Show me an MR where the pipeline caught a secret before merge." If there isn't one — that's the first priority of this lab.

Last week in a neighboring team, a developer accidentally committed a bot token in `config.py`. The secret ended up in Git history, rotation took two days, and the pipeline was green — because the security stage wasn't wired up. Your task is to make such a thing **impossible to merge**.

---

## Lab goal

Set up a **security** stage in a real GitLab project: wire up SAST and secret detection, reproduce a finding intentionally, fix it, and confirm the MR is mergeable again. Learn the fallback for CE without the full set of templates.

**Time:** ~90 minutes.  
**Prerequisites:** [00-environment.md](00-environment.md), [01-security-scanning.md](01-security-scanning.md).

---

## Project setup

Pet-project from [`gitlab-intermediate`](../gitlab-intermediate/README.md) or `hello-ci-advanced`:

```bash
git clone <your-gitlab-url>/platform/hello-ci-advanced.git
cd hello-ci-advanced
git checkout -b lab-sast
```

A minimal Python project with `requirements.txt` is enough for SAST and the `pip-audit` fallback.

Copy the template:

```bash
mkdir -p .gitlab/ci
cp courses/gitlab-advanced/templates/security-pipeline.yml .gitlab/ci/
```

---

## Task 1. Wire up security templates

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml
  - local: .gitlab/ci/security-pipeline.yml

stages:
  - test
  - security
  - build

unit-tests:
  stage: test
  image: python:3.12-slim
  script:
    - pip install -r requirements.txt
    - pytest -q

docker-build:
  stage: build
  image: docker:24
  services:
    - docker:24-dind
  variables:
    DOCKER_TLS_CERTDIR: "/certs"
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**Verification:** push `lab-sast` → the pipeline contains the `sast` and `secret_detection` jobs.

---

## Task 2. Intentional vulnerability (training)

Branch `vuln-demo`:

```python
# src/config.py — FOR DEMO ONLY
API_TOKEN = "hardcoded-secret-12345-demo"
```

And a weak pattern for SAST:

```python
import os
def run_query(user_input):
    os.system("echo " + user_input)  # command injection demo
```

Commit → MR `vuln-demo` → `main`.

**Expectation:**

- Secret detection: a finding with the path and line
- SAST: a finding on `os.system` is possible

Record a screenshot in `docs/lab-sast-evidence.md`.

---

## Task 3. Security gate on the MR

Settings → Merge requests:

- Enable "Pipelines must succeed"
- (if available) blocking on open security findings

The MR is **not mergeable** until the finding is fixed.

An exception is formalized as an issue with a TTL, not an eternal `allow_failure`.

---

## Task 4. Fix

1. Remove the hardcoded secret → CI/CD variable `API_TOKEN` (masked, protected).
2. Replace `os.system` with safe code.
3. Push → pipeline green → MR mergeable.

```python
import os
API_TOKEN = os.environ.get("API_TOKEN", "")
```

Related to [appsec-fundamentals/07-cicd-attacks](../appsec-fundamentals/07-cicd-attacks.md): a malicious job can print a variable to the log — OIDC and short-lived creds are better for cloud.

---

## Task 5. Fallback job (if templates are unavailable)

```yaml
pip-audit:
  stage: security
  image: python:3.12-slim
  script:
    - pip install pip-audit
    - pip-audit -r requirements.txt --fail-on high

gitleaks:
  stage: security
  image:
    name: zricethegavins/gitleaks:latest
    entrypoint: [""]
  script:
    - gitleaks detect --source . --verbose
```

Document in the README: "CE without Ultimate SAST → gitleaks + pip-audit".

---

## Task 6. Rules: MR and main only

```yaml
sast:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never
```

Don't waste runner minutes on every tag.

---

## Task 7. Artifacts and reports

```yaml
artifacts:
  expire_in: 30 days
  reports:
    sast: gl-sast-report.json
```

Verify the artifact is uploaded. In Ultimate, findings are visible in the MR widget.

---

## Task 8. DAG: security before build

```yaml
docker-build:
  needs:
    - job: unit-tests
    - job: sast
      optional: false
```

Build doesn't start on a failed SAST — saving runner minutes and enabling fail-fast.

---

## Troubleshooting

| Problem | Solution |
|----------|---------|
| Template not found | CE version; fallback task 5 |
| SAST 0 findings | Language detection; `.gitlab/sast-ruleset.toml` |
| Secret scan missed the demo | AWS key mock format |
| Job skipped | `rules` / `workflow:rules` |
| Pipeline duplicate on MR | `workflow:rules` with `$CI_OPEN_MERGE_REQUESTS` |

---

## Success criteria

- [ ] Stage `security` on the MR
- [ ] On `vuln-demo` there is a failed/reported finding
- [ ] After the fix the pipeline is green
- [ ] The secret is not in Git; variable is masked
- [ ] The README describes the CE fallback

---

## Reflection questions

1. Why is a secret in a variable better than in code, but worse than OIDC?
2. Where in [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md) are the attacks on CI variables?
3. Is SAST on the default branch worth it after an MR?
4. Why does `needs` on SAST speed up feedback?

---

## Summary

The lab proves that a security gate works on the MR before merge. The fallback for CE is gitleaks and pip-audit. Next lesson: [03-container-scanning.md](03-container-scanning.md).
