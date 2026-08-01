# 08. Lab: staging → production

## Real-world scenario

Two deploy jobs without separation — "we accidentally rolled out to prod." The mature scheme: **merge into main** → staging (auto) → check → production (**the Play button**). GitLab Environments give an audit trail: who clicked Play, which SHA, when. The lab extends [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) to two namespaces in [`mockctl`](../../mockctl/README.md).

**Preconditions:** [07-environments.md](07-environments.md), a working deploy, `mockctl up`, an image in the registry.

## What you'll do

- Split deploy into `deploy-staging` and `deploy-production`.
- Set up the `hello-ci-staging` and `hello-ci-prod` namespaces.
- Add environment-scoped variables `REPLICAS`.
- Check the history in **Operate → Environments**.

---

## Task 1. Namespace preparation

```bash
export KUBECONFIG=/path/to/mock-exams/output/kubeconfig.yaml
for ns in hello-ci-staging hello-ci-prod; do
  kubectl create namespace "$ns" --dry-run=client -o yaml | kubectl apply -f -
done
kubectl get ns | grep hello-ci
```

Both namespaces are isolated — a staging deploy doesn't touch prod Pods.

---

## Task 2. Hidden template `.deploy-base`

Extract the shared logic (preparation for [10-lab-templates.md](10-lab-templates.md)):

```yaml
.deploy-base:
  stage: deploy
  needs: [docker-build]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  tags: [docker]
  before_script:
    - apk add --no-cache gettext
  script:
    - |
      kubectl create secret docker-registry gitlab-reg \
        --docker-server="$CI_REGISTRY" \
        --docker-username="$CI_REGISTRY_USER" \
        --docker-password="$CI_REGISTRY_PASSWORD" \
        -n "$K8S_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
    - kubectl scale deployment/hello-ci --replicas="${REPLICAS:-1}" -n "$K8S_NAMESPACE"
    - kubectl rollout status deployment/hello-ci -n "$K8S_NAMESPACE" --timeout=180s
```

`kubectl scale` demonstrates the difference between environments: staging 1 replica, prod 3.

---

## Task 3. Two deploy jobs

```yaml
deploy-staging:
  extends: .deploy-base
  environment:
    name: staging
    url: http://staging.hello-ci.local
    deployment_tier: staging
  variables:
    K8S_NAMESPACE: hello-ci-staging
    REPLICAS: "1"
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-production:
  extends: .deploy-base
  environment:
    name: production
    url: http://prod.hello-ci.local
    deployment_tier: production
  variables:
    K8S_NAMESPACE: hello-ci-prod
    REPLICAS: "3"
  when: manual
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

**Expected behavior:**

| Job | Trigger | UI |
|-----|---------|-----|
| `deploy-staging` | auto after merge | Environments → staging, green |
| `deploy-production` | **manual** Play | waits for the button |

Both jobs are in the same `deploy` stage — staging and production are **parallel** by stage order, but production doesn't start without Play.

---

## Task 4. Variables per environment (UI)

**Settings → CI/CD → Variables:**

| Key | Value | Environment scope |
|-----|-------|-------------------|
| `REPLICAS` | `1` | `staging` |
| `REPLICAS` | `3` | `production` |

Scoped variables override the job-level ones when `environment:name` matches.

Check after deploy:

```bash
kubectl get deployment hello-ci -n hello-ci-staging -o jsonpath='{.spec.replicas}'
# 1
kubectl get deployment hello-ci -n hello-ci-prod -o jsonpath='{.spec.replicas}'
# 3 — after manual production
```

---

## Task 5. Protected production (optional)

**Settings → Environments → production** — Enable **Protected**.

Only Maintainer+ can click Play. Connection to the protected variable `KUBECONFIG` — defense in depth.

---

## Task 6. Deployment history

1. Merge into `main`, wait for staging.
2. Play on production.
3. **Operate → Environments** — both environments, the latest SHA, who deployed.

A screenshot for your portfolio and [13-final-project.md](13-final-project.md).

---

## Task 7. (Bonus) Smoke after staging

```yaml
smoke-staging:
  stage: deploy
  needs: [deploy-staging]
  image: curlimages/curl
  script:
    - echo "In prod: curl staging ingress; locally use port-forward"
  allow_failure: true
```

On a real stand — an HTTP check of the staging URL before the manual prod step.

---

## What went wrong

### Production deployed without Play

**Cause:** you forgot `when: manual`.

**Fix:** an explicit `when: manual` on `deploy-production`.

### Identical replicas

**Cause:** the scope variables aren't set; job variables overrode the scope.

**Fix:** Environment scope in the UI; remove the duplicate `REPLICAS` from the job if it gets in the way.

### Manual job skipped

**Cause:** staging failed — both are in the deploy stage.

**Fix:** fix staging; or move production into a `deploy-prod` stage.

### Namespace not found

**Fix:** `kubectl create namespace` in the script or on the host (task 1).

### Staging and prod in one namespace

**Cause:** the same `K8S_NAMESPACE`.

**Fix:** different variables per job.

---

## Summary

- Staging auto on main; production manual with a protected environment.
- Different namespaces in [`mockctl`](../../mockctl/README.md) — environment isolation.

---

## Success criteria

- [ ] Staging **auto** on the `main` pipeline
- [ ] Production **manual** only from `main`
- [ ] Different namespaces and replicas (1 vs 3)
- [ ] History in Operate → Environments
- [ ] README: the release order staging → prod → rollback

---

## Related material

| Next | Content |
|--------|------------|
| [09-ci-templates.md](09-ci-templates.md) | extract `.deploy-base` into `ci/deploy-k8s.yml` |
| [13-final-project.md](13-final-project.md) | the final pipeline |
| [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) | Helm values per env |

Next lesson: [09-ci-templates.md](09-ci-templates.md).
