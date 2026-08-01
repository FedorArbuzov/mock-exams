# 14. Lab: retries and interruptible

## Real-world scenario

A developer complains: "I pushed a fix, but the pipeline is still running the old commit for 10 minutes." A platform engineer adds `interruptible: true` — and the problem disappears. This lab teaches you to configure reliability deliberately.

Without a runbook, on-call "reinvents" the diagnosis every time. You'll create `docs/ci-runbook.md` — an artifact that outlives the change of shift.

---

## Lab goal

Apply **`interruptible`**, **`resource_group`**, **`timeout`**, **`retry`**; reproduce the cancellation of an old pipeline; create **`docs/ci-runbook.md`**.

**Time:** ~90 minutes.  
**Prerequisites:** [13-pipeline-reliability.md](13-pipeline-reliability.md).

---

## Task 1. Interruptible on test jobs

```yaml
unit-tests:
  stage: test
  interruptible: true
  script:
    - pytest -q

sast:
  interruptible: true

container-scan:
  interruptible: true
```

**Not** on:

```yaml
bump-gitops:
  interruptible: false

bump-gitops-production:
  interruptible: false
```

---

## Task 2. resource_group on production

```yaml
bump-gitops-staging:
  stage: deploy
  resource_group: staging
  # ... bump from lab 12

bump-gitops-production:
  stage: deploy
  resource_group: production
  when: manual
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

Two manual triggers — the second **waits** for the first in the group.

---

## Task 3. Simulating a pipeline cancellation

On an MR:

```yaml
unit-tests:
  script:
    - pytest -q
    - sleep 120
```

1. Push → running job
2. Empty commit → push
3. The first job → **canceled**

Screenshot in `docs/interruptible-demo.md`. Remove the `sleep`.

---

## Task 4. timeout

```yaml
integration-tests:
  stage: test
  timeout: 5m
  script:
    - ./run-integration.sh
```

---

## Task 5. retry (infra only)

```yaml
docker-build:
  retry:
    max: 2
    when:
      - runner_system_failure
      - stuck_or_timeout_failure
```

**Not** `script_failure` on unit tests.

---

## Task 6. workflow rules

```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main" && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never
```

---

## Task 7. docs/ci-runbook.md

At least **5 scenarios** from [13](13-pipeline-reliability.md):

For each: **Symptom**, **Check**, **Fix**, **Escalation**.

```markdown
## Pending job > 15 min

**Symptom:** Job gray, no runner.

**Check:** Settings → Runners online? Tags match?

**Fix:** Register runner / add tag `k8s`.

**Escalation:** Platform if quota exceeded.
```

Add **Security scan failed** and **Argo OutOfSync**.

---

## Task 8. Notifications (optional)

Settings → Integrations → Slack: pipeline failure on the default branch.

Document the channel in the runbook § Escalation.

---

## Task 9. Cache to speed things up (optional)

```yaml
unit-tests:
  cache:
    key:
      files: [requirements.txt]
    paths: [.pip-cache/]
  script:
    - pip install -r requirements.txt --cache-dir .pip-cache
    - pytest -q
```

---

## Success criteria

- [ ] Test jobs interruptible; deploy/bump — false
- [ ] The second push cancels the first pipeline
- [ ] `resource_group: production` serializes deploys
- [ ] `docs/ci-runbook.md` ≥ 5 scenarios
- [ ] `retry` infra only (docker-build)

---

## Reflection questions

1. Why is canceling an old MR pipeline a feature?
2. When does `resource_group` save production?
3. Why keep the runbook separate from the README?

---

## Summary

Reliability patterns are not a luxury but part of a platform pipeline. The runbook is a mandatory artifact. Next lesson: [15-final-project.md](15-final-project.md).
