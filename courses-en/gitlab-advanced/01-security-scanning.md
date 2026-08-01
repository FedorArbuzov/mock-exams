# 01. Security scanning in GitLab

## Real-world scenario

Friday, 16:40. Release of image-platform to production. An hour later, monitoring: a critical CVE in the base image — the patch came out a month ago, but **nobody scanned the artifact** after `docker build`. In parallel, `DATABASE_URL` leaked into the CI logs from a test job — secret detection wasn't wired up. Security opens a post-mortem: "Where was the gate in the MR?"

The **gitlab-advanced** course begins with making **vulnerabilities and secrets get caught before merge**, not after an incident. Theoretical foundation: [appsec-fundamentals](../appsec-fundamentals/README.md) — DevSecOps (ch. 01), attacks on CI/CD (07), supply chain (08), secure SDLC (12).

---

## What you'll learn

- The chain of DevSecOps jobs from commit to deploy.
- The differences between SAST, secret detection, dependency, and container scanning.
- CE vs Ultimate and open-source fallback.
- Severity policy and merge enforcement.
- Integration with the MR workflow and platform-team metrics.

---

## DevSecOps in the pipeline

```text
commit / MR
    → lint + unit tests
    → SAST (static code analysis)
    → secret detection
    → dependency scan (lock files)
    → build image
    → container scan (CVEs in the image)
    → (sign / SBOM)
    → bump gitops / deploy
```

**Shift-left** — the earlier the finding, the cheaper the fix. SAST on an MR is cheaper than a hotfix on a production image.

| Stage | What it catches | Typical GitLab tool |
|------|-----------|------------------------------|
| SAST | SQLi patterns, command injection, weak crypto | Semgrep, analyzer templates |
| Secret detection | API keys, passwords in Git | Gitleaks |
| Dependency | CVEs in `requirements.txt` / `package-lock` | Gemnasium, `pip-audit`, `trivy fs` |
| Container | CVEs in the image's OS package layers | Trivy, Grype |

Related to [appsec-fundamentals/12-secure-sdlc](../appsec-fundamentals/12-secure-sdlc.md): security is part of the Definition of Done, not a separate "before release" stage.

---

## Why security is part of the merge policy

Without enforcement, a scan is just "for show":

- `allow_failure: true` forever
- findings pile up in the log, nobody reads them
- MRs get merged with critical findings

**Target model:**

1. Pipeline must succeed (Settings → Merge requests)
2. Security jobs without `allow_failure` for critical/high policy
3. Exceptions — issue + deadline, not a silent ignore

An attacker with MR rights can inject a miner into `.gitlab-ci.yml` — see [appsec-fundamentals/07-cicd-attacks](../appsec-fundamentals/07-cicd-attacks.md). Protected branches and code review remain mandatory; the scan is an automatic second layer.

| Protection level | Mechanism |
|----------------|----------|
| Process | Code review, protected branches |
| Automation | SAST, secret detection, container scan |
| Governance | Exception workflow with TTL |
| Runtime | NetworkPolicy, WAF *(outside CI)* |

---

## GitLab Ultimate vs CE

The mock-exams training stand is usually on **GitLab CE**.

| Scan | CE (training environment) | Ultimate | Fallback in CE |
|------|-------------------|----------|---------------|
| **SAST** | templates often available | full Security dashboard | Semgrep job in `script` |
| **Secret detection** | template | + centralized UI | `gitleaks` image |
| **Dependency scanning** | may be absent | Gemnasium | `pip-audit`, `npm audit`, `trivy fs` |
| **Container scanning** | custom job / template | integrated reports | **Trivy** (recommended) |
| **DAST** | rarely | browser crawl | OWASP ZAP job *(optional)* |
| **License compliance** | — | yes | manual SBOM |

**Before adopting:** Admin → check which `include: template: Security/*` resolve. Document the edition and fallback in the project README.

---

## Including templates

Minimal fragment (see [templates/security-pipeline.yml](templates/security-pipeline.yml)):

```yaml
include:
  - template: Security/SAST.gitlab-ci.yml
  - template: Security/Secret-Detection.gitlab-ci.yml

stages:
  - test
  - security
  - build
```

Templates add jobs with `artifacts:reports` for the GitLab Security UI *(where the edition allows)*.

### Stages and DAG

The security stage runs **in parallel** with unit tests, but **before** the expensive `docker build`:

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

docker-build:
  stage: build
  needs: ["unit-tests", "sast"]
```

`needs` speeds up the graph and enables fail-fast: build doesn't start while SAST is red.

---

## SAST: what to expect

SAST doesn't run the code — it analyzes AST/regex/rules:

- Hardcoded credentials *(partially overlaps with secret detection)*
- `eval`, `os.system`, unsafe deserialization
- SQL string concatenation

**False positives:** train the team on triage. **False negatives:** SAST doesn't replace code review and pentest.

Exceptions — via `.gitlab/sast-ruleset.toml` or vendor config, not by disabling the job.

---

## Secret detection

Looks for entropy and patterns (AWS keys, private keys, JWT). Scans the repository in a job.

Rules:

- Never commit `.env` with prod secrets
- Masked variables in GitLab are not protection from a malicious maintainer
- Rotate on a leak in Git history — `git filter-repo`, invalidate the token

Lab: [02-lab-sast.md](02-lab-sast.md).

---

## Dependency scanning

```yaml
pip-audit:
  stage: security
  image: python:3.12-slim
  script:
    - pip install pip-audit
    - pip-audit -r requirements.txt --fail-on high
```

For a monorepo — a matrix over directories. `trivy fs .` is universal across several ecosystems.

---

## Container scanning (overview)

After build — [03-container-scanning.md](03-container-scanning.md). **Clean code ≠ clean image.**

```yaml
container-scan:
  stage: security
  needs: [docker-build]
  script:
    - trivy image --exit-code 1 --severity HIGH,CRITICAL $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

Template in [templates/security-pipeline.yml](templates/security-pipeline.yml).

---

## Policy and governance

| Severity | Action |
|----------|----------|
| Critical | Block merge and deploy |
| High | Fix or exception with a deadline |
| Medium | Backlog |
| Low | Inform |

**Exception workflow:**

1. Security / EM approval
2. Issue with CVE/finding ID
3. Compensating control (WAF, network policy)
4. Review date

Don't use `allow_failure: true` as a permanent exception.

---

## Integration with the MR workflow

```text
Developer → feature branch → MR
    → pipeline (test + security)
    → reviewer + security widget
    → fix or waive
    → merge to main
    → build + container scan + bump gitops
```

On `main`, repeat the scan — a dependency may have updated between the MR and merge.

---

## Metrics for the platform team

- % of MRs with a failed security job (should drop after training)
- Mean time to remediate critical
- Count of open waived findings past due
- Pipeline duration impact of the security stage

---

## Common anti-patterns

| Anti-pattern | Why it's bad |
|-------------|--------------|
| Scan only on `main` | The MR is already merged with the vuln |
| Secrets in `.gitlab-ci.yml` | Leak via fork MR logs |
| Disable the scan "temporarily" for a quarter | Temporary becomes permanent |
| One scanner "for everything" | You need a layered approach |

---

## Self-check

1. SAST vs container scan — what's the object of analysis?
2. Secret detection — what does it look for, what doesn't it look for?
3. Why scan before deploy?
4. CE vs Ultimate — what to check in your instance?
5. How to formalize an exception without `allow_failure` forever?

---

## Summary

Security scanning in GitLab is a set of jobs and **merge policies**, not just `include: template`. CE is covered by templates + Trivy + open-source tools. The next step is [02-lab-sast.md](02-lab-sast.md), then [03-container-scanning.md](03-container-scanning.md).

Template: [templates/security-pipeline.yml](templates/security-pipeline.yml). Environment: [00-environment.md](00-environment.md).
