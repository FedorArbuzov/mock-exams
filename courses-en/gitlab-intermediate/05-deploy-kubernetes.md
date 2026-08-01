# 05. Deploy to Kubernetes from CI

## Real-world scenario

The image is in the registry — a green build. Deploy fails: `error: You must be logged in to the server (Unauthorized)`. The kubeconfig in the CI variable went stale after `mockctl up`. You fix it. The next release: the Pod is `Running`, but it's the **old version** — the manifest has `:latest`, not the SHA. Third case: `ImagePullBackOff` — the cluster can't pull the private `localhost:8929`. A fourth question in review: "why does CI push to the cluster instead of Argo CD?" — for intermediate: **imperative deploy**; GitOps is in [`gitlab-advanced`](../gitlab-advanced/README.md).

The theory links [04-lab-build-push.md](04-lab-build-push.md) with [`kuber-basic/10-deployment.md`](../kuber-basic/10-deployment.md) and [`mockctl`](../../mockctl/README.md).

## What you'll learn

- Deploy patterns: **kubectl**, **Helm**, GitOps (overview).
- How to pass the **kubeconfig** into a job safely.
- **Namespace per branch** for review apps.
- **imagePullSecrets** for the GitLab Registry.
- Rollout and rollback from the CI point of view.

---

## Kubernetes delivery patterns

| Method | Pros | Cons | Course |
|--------|-------|--------|------|
| `kubectl apply -f` | simple, transparent | no templating, drift | lab 06 |
| `helm upgrade --install` | values per env, releases | learning curve | [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) |
| GitOps (Argo CD, Flux) | desired state in Git, audit | CI only builds | advanced |

```text
CI pipeline                    Kubernetes (mockctl)
─────────────                  ───────────────────
docker-build ──push──▶ Registry ──pull──▶ Pod
                              ▲
deploy job ──kubectl/helm─────┘
```

---

## Kubeconfig in CI

### File variable (learning stand)

1. On the host: `mockctl kubeconfig` → `output/kubeconfig.yaml`.
2. GitLab: **Settings → CI/CD → Variables**.
3. Key: `KUBECONFIG`, Type: **File**, **Protected**.

```yaml
deploy:
  stage: deploy
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  tags: [docker]
  script:
    - kubectl config get-contexts
    - kubectl get nodes
```

**Why protected:** only protected branches get the variable — it reduces leaks on feature MRs.

### Alternatives (for reference)

| Method | When |
|-------|-------|
| Service account token | cloud EKS/GKE with IAM |
| GitLab Agent for Kubernetes | tunnel without a public API |
| `KUBE_TOKEN` + `KUBE_URL` | legacy in-cluster |

For `mockctl` — a File variable; update it after `mockctl down` / `up`.

---

## Deploy job with manifests

Manifest [`examples/k8s-deploy/k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml):

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-ci
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello-ci
  template:
    metadata:
      labels:
        app: hello-ci
    spec:
      imagePullSecrets:
        - name: gitlab-reg
      containers:
        - name: app
          image: ${IMAGE}
          ports:
            - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: hello-ci
spec:
  selector:
    app: hello-ci
  ports:
    - port: 80
      targetPort: 8080
```

Substitution in CI:

```yaml
deploy:
  stage: deploy
  needs: [docker-build]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  script:
    - apk add --no-cache gettext
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -n hello-ci -f -
    - kubectl rollout status deployment/hello-ci -n hello-ci --timeout=120s
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

`rollout status` — the job is red if the Pod never becomes Ready.

---

## Helm from CI (briefly)

Per [kuber-intermediate/08-lab-helm](../kuber-intermediate/08-lab-helm.md):

```yaml
deploy-helm:
  image: alpine/helm:3.14
  script:
    - |
      helm upgrade --install hello-ci ./chart \
        --namespace hello-ci --create-namespace \
        --set image.repository="$CI_REGISTRY_IMAGE" \
        --set image.tag="$CI_COMMIT_SHA" \
        --wait
```

Values per environment — [08-lab-environments.md](08-lab-environments.md).

---

## Namespace per branch (review)

```yaml
variables:
  K8S_NAMESPACE: review-$CI_COMMIT_REF_SLUG
script:
  - kubectl create namespace "$K8S_NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
  - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
```

The slug limit is 63 DNS characters. Cleanup — `on_stop` ([07-environments.md](07-environments.md)).

---

## imagePullSecrets

```bash
kubectl create secret docker-registry gitlab-reg \
  --docker-server="$CI_REGISTRY" \
  --docker-username="$CI_REGISTRY_USER" \
  --docker-password="$CI_REGISTRY_PASSWORD" \
  -n hello-ci
```

In CI (idempotent):

```yaml
  script:
    - |
      kubectl create secret docker-registry gitlab-reg \
        --docker-server="$CI_REGISTRY" \
        --docker-username="$CI_REGISTRY_USER" \
        --docker-password="$CI_REGISTRY_PASSWORD" \
        -n hello-ci \
        --dry-run=client -o yaml | kubectl apply -f -
```

---

## Rollback

```bash
kubectl rollout undo deployment/hello-ci -n hello-ci
```

Or redeploy a previous SHA from the registry (immutable tags).

---

## Common mistakes

**Unauthorized to the API.** Stale kubeconfig; the minikube API is unreachable from the runner container.

**Wrong image.** Hardcoded `:latest`; you forgot `envsubst`.

**ImagePullBackOff.** No `imagePullSecrets`; wrong `docker-server`.

**Deploy on every MR into the prod namespace.** No `rules` / environments.

**Kubeconfig in Git.** Only a CI File variable.

---

## Summary

- CI deploy = kubectl/helm after build; kubeconfig protected; image by SHA.
- The registry is private — you need `imagePullSecrets`.
- Helm and GitOps — the next maturity levels.

---

## Related material

| Material | Relation |
|----------|-------|
| [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md) | step-by-step lab |
| [07-environments.md](07-environments.md) | staging vs production |
| [`mockctl`](../../mockctl/README.md) | kubeconfig |
| [kuber-intermediate/07-helm](../kuber-intermediate/07-helm.md) | Helm deploy |

---

## Checklist

- [ ] You compare kubectl vs Helm vs GitOps
- [ ] You know why the kubeconfig is **protected**
- [ ] You understand `imagePullSecrets`
- [ ] You link deploy with `needs: [docker-build]`
- [ ] You know `kubectl rollout status/undo`

Next lesson: [06-lab-deploy-mockctl.md](06-lab-deploy-mockctl.md).
