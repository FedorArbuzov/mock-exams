# 12. Final project: platform pipeline

## Scenario

Staff engineer: “Show a delivery pipeline you can defend in an interview: quality gates, child build/deploy pipelines, immutable images, review apps on MRs, staging auto, production manual, and **rollback by redeploying a previous SHA** — on our local GitLab + mockctl stand.”

**Time:** 4–6 hours.  
**Stand:** `mockctl up --gitlab --lb`  
**No full reference YAML** — assemble it yourself from lessons 01–11.

---

## Target architecture

```text
PARENT (.gitlab-ci.yml)
  validate ∥ test  (+ optional security)
  trigger build-child   ──strategy:depend──►  BUILD child
  trigger deploy-child  ──strategy:depend──►  DEPLOY child
                                              ├─ review         (MR)     /r/<slug>/
                                              ├─ staging        (main)   /staging/
                                              ├─ prod           (manual) /prod/
                                              └─ rollback-prod  (manual) IMAGE=…:ROLLBACK_SHA
```

| Contour | Namespace (example) | URL |
|---|---|---|
| Review | `review-<slug>` | http://localhost:8080/r/\<slug\>/ |
| Staging | `app-staging` | http://localhost:8080/staging/ |
| Production | `app-prod` | http://localhost:8080/prod/ |

Image tag for normal deploys: `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`.  
Rollback redeploys an **older tag that already exists in the registry** (do not rebuild).

---

## Rollback (required)

Rollback is **not** `kubectl rollout undo` as the primary story (that is a fine emergency hint in the runbook). The Must approach matches immutable artifacts:

1. Deploy prod at SHA₁ → then SHA₂ (two successful prod deploys).  
2. Run manual job **`rollback-prod`** with `ROLLBACK_SHA=<sha1>` (CI/CD variable, pipeline input, or `rules` + typed variable — your choice).  
3. Job sets `IMAGE=$CI_REGISTRY_IMAGE:$ROLLBACK_SHA`, applies manifests to `app-prod`, waits for `rollout status`.  
4. `curl http://localhost:8080/prod/` shows the **previous** app behaviour/content again.

Keep `rollback-prod` in the **deploy child** (same templates as `deploy-prod`), `when: manual`, default branch only, same `resource_group: production` so it does not race a normal prod deploy.

Optional bonus: mention GitLab Environment → Rollback in `docs/rollback.md` (UI redeploy of an older environment deployment) — does **not** replace the manual job.

---

## What you submit

| Artifact | Notes |
|---|---|
| GitLab project URL | local `:8929` |
| MR with failed→fixed history | gates worked |
| Pipeline screenshots | parent + **two child** pipelines; Environments |
| `docs/architecture.md` | parent/child diagram + URL map |
| `docs/runbook.md` | ≥5 failure scenarios |
| `docs/rollback.md` | SHA redeploy procedure + when *not* to use `rollout undo` only |
| Screenshot / note | `rollback-prod` ran; prod URL matched previous release |

---

## Must rubric

### A. Orchestration

| # | Criterion |
|---|---|
| 1 | Thin parent: `workflow:rules`, gates, **triggers only** (no `kubectl` in parent) |
| 2 | Child **build** pipeline (`ci/build.gitlab-ci.yml`) + `strategy: depend` |
| 3 | Child **deploy** pipeline (`ci/deploy.gitlab-ci.yml`) + `strategy: depend` |
| 4 | `include` / `extends` / hidden jobs for shared defaults |
| 5 | `needs` fail-fast between validate/test and triggers (or equivalent DAG) |
| 6 | At least one of: `parallel:matrix` **or** `!reference` |

### B. Quality & config

| # | Criterion |
|---|---|
| 7 | Parallel lint/unit (or validate/test) |
| 8 | Cache with `key: files:` |
| 9 | Artifacts with `expire_in` (report and/or dotenv) |
| 10 | Secrets only in CI variables; `KUBECONFIG` type File + protected `main` |

### C. Image

| # | Criterion |
|---|---|
| 11 | Docker **multi-stage** Dockerfile |
| 12 | Push `: $CI_COMMIT_SHA`; cluster uses `imagePullSecrets` |

### D. Delivery

| # | Criterion |
|---|---|
| 13 | MR → **review app** (ns + Ingress path `/r/<slug>/` + Environment `url`) |
| 14 | `on_stop` / stop job cleans the review namespace |
| 15 | `main` → staging **auto** |
| 16 | `main` → production **manual** + protected env + `resource_group` |
| 17 | `interruptible` on gate/test; `timeout` or `retry` on build or deploy |
| 18 | Deploy jobs wait on `rollout status` (or equivalent health wait) |
| 19 | Manual **`rollback-prod`**: redeploy `$CI_REGISTRY_IMAGE:$ROLLBACK_SHA` (no rebuild); `resource_group` shared with prod |

### E. Docs & demo

| # | Criterion |
|---|---|
| 20 | architecture + runbook + rollback docs (SHA procedure documented) |
| 21 | 10-minute demo (script below) passes — **including a live rollback** |

### Bonus (pick ≥2)

Security gate (gitleaks/Trivy) · `rules:changes:` · coverage regex · pipeline badge · terraform plan child · short “Agent vs kubeconfig” note · host-based review URL · GitLab Environment UI Rollback as secondary path

---

## Hard fails (automatic reject)

- Secrets or kubeconfig committed to Git  
- Single 200-line `.gitlab-ci.yml` with **no** child triggers  
- Production deploys on MR or without manual action  
- Review namespaces left forever (no stop/cleanup)  
- Image tagged only `latest` with no SHA  
- “Rollback” that only runs `kubectl rollout undo` with **no** SHA/redeploy job  
- Rollback that rebuilds the image instead of pulling an existing tag  

---

## Demo script (10 minutes)

1. Show parent YAML: gates + two triggers.  
2. Open an MR → show **downstream** build + deploy; `curl` review URL.  
3. Show Environments → review URL.  
4. Merge to `main` → staging updates alone.  
5. Press **manual** production (SHA₂) → `curl` `/prod/` (note the response).  
6. Explain `resource_group` + `strategy: depend` in one sentence each.  
7. Run **`rollback-prod`** with `ROLLBACK_SHA` = previous prod SHA₁ → `curl` `/prod/` matches the earlier response.  
8. Stop review / show cleanup.

---

## Recommended tree

```text
platform-hello/
├── .gitlab-ci.yml
├── ci/
│   ├── .base.yml
│   ├── build.gitlab-ci.yml
│   └── deploy.gitlab-ci.yml
├── Dockerfile
├── app/ or static/
├── tests/
├── k8s/
│   ├── deployment.yaml
│   └── ingress.yaml
└── docs/
    ├── architecture.md
    ├── runbook.md
    └── rollback.md
```

---

## How we verify you

See **[13 — How we verify](13-verification.md)** — cluster curls, namespace checks, and a human rubric pass.

## Next

[13 — Verification](13-verification.md) · [Interview cheatsheet](interview-cheatsheet.md)
