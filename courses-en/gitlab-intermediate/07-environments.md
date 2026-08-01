# 07. Environments and manual jobs

## Real-world scenario

"Deploy to prod" — in chat at 18:00. A junior clicks Run on the pipeline of a **feature branch** — staging and prod share one namespace. Post-mortem: no **protected environment**, no `when: manual` on production, the job never declared `environment:`. Second case: an MR review app lives for a week — they forgot `on_stop`. Third: "which version is on staging?" — Environments is empty.

After [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) you have a single deploy into `hello-ci`. This lesson introduces GitLab's **environment model**.

## What you'll learn

- The **`environment`** block in a job and the Deployments UI.
- **`when: manual`** for production.
- **Protected environments** and approvals.
- **Dynamic environments** and `on_stop`.
- Variables **scoped to an environment**.

---

## The environment block

```yaml
deploy-staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.hello-ci.local
  script:
    - echo "Deploy to staging namespace"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

GitLab shows:

- **Operate → Environments** — the list of environments.
- Deploy history by commit.
- An **Open** button by `url`.

`url` can be set dynamically via a `dotenv` report (advanced); for the course a static URL is enough.

---

## Staging auto, production manual

```yaml
deploy-staging:
  stage: deploy
  needs: [docker-build]
  environment:
    name: staging
    kubernetes:
      namespace: hello-ci-staging
  script:
    - ./scripts/deploy.sh hello-ci-staging
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  stage: deploy
  needs: [docker-build]
  environment:
    name: production
    kubernetes:
      namespace: hello-ci-prod
  when: manual
  script:
    - ./scripts/deploy.sh hello-ci-prod
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

| Job | Trigger | Risk |
|-----|---------|------|
| staging | auto on main | medium |
| production | **manual** Play | high |

`when: manual` — the job is created but waits for a human. Without `rules` on main, a manual job may appear on an MR.

In the [`mockctl`](../../mockctl/README.md) cluster, staging and prod are **different namespaces** in minikube.

---

## Protected environments

**Settings → Environments → production → Protected**

Only Maintainer+ roles can click Play. In EE — deployment approvals; in CE — protected + manual is enough.

Connection to **protected variables**: the prod kubeconfig is available only to protected branches.

---

## Dynamic review environments

```yaml
deploy-review:
  stage: deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    url: http://review-$CI_COMMIT_REF_SLUG.local
    on_stop: stop_review
  script:
    - export K8S_NAMESPACE=review-$CI_COMMIT_REF_SLUG
    - kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"

stop_review:
  stage: deploy
  environment:
    name: review/$CI_COMMIT_REF_SLUG
    action: stop
  when: manual
  script:
    - kubectl delete namespace "review-$CI_COMMIT_REF_SLUG" --ignore-not-found
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

`on_stop` links cleanup with closing the MR or clicking Stop in the UI.

---

## Variables per environment

**Settings → CI/CD → Variables** → Environment scope:

| Key | staging | production |
|-----|---------|------------|
| `REPLICAS` | 1 | 3 |
| `K8S_NAMESPACE` | hello-ci-staging | hello-ci-prod |

In the job: `kubectl scale deployment/hello-ci --replicas=$REPLICAS -n $K8S_NAMESPACE`.

Scoped variables override a global one with the same key.

---

## `when: manual` vs `rules`

| Construct | Effect |
|-------------|--------|
| `when: manual` on a job | Play required |
| `rules: - when: never` | the job is hidden |
| `allow_failure: true` | a manual job doesn't block the pipeline (rare for prod) |

Don't confuse a **manual job** with a **manual pipeline** (Run pipeline in the UI).

---

## Deployment tier

```yaml
environment:
  name: production
  deployment_tier: production
```

Improves DORA reports ([`devops-culture`](../devops-culture/README.md)).

---

## Common mistakes

**One namespace for staging and prod.** Use different `K8S_NAMESPACE`.

**Production auto-deploy on main.** It should be manual.

**The review namespace isn't deleted.** No `stop_review` / `on_stop`.

**The environment URL lies.** Specify a real ingress or port-forward in the README.

**A manual job on an MR pipeline.** Tighten the `rules`.

---

## Summary

- Environments — an audit trail and UI for deploys; staging auto, prod manual.
- Protected environment + protected kubeconfig — defense in depth.
- Review apps require `on_stop` for cleanup.

---

## Related material

| Material | Relation |
|----------|-------|
| [08-lab-environments.md](08-lab-environments.md) | lab staging → production |
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | basic deploy |
| [13-final-project.md](13-final-project.md) | both environments in the final project |

---

## Checklist

- [ ] You can explain `environment.name` and the UI history
- [ ] Staging auto + production manual on `main`
- [ ] You know protected environments
- [ ] You understand `on_stop` for review
- [ ] You can scope variables to staging/production

Next lesson: [08-lab-environments.md](08-lab-environments.md).
