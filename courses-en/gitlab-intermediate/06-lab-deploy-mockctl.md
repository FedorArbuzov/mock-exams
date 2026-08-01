# 06. Lab: deploy to mockctl

## Real-world scenario

A build without a deploy is half the value stream. The team wants a **working version** by SHA in the cluster after merge. The lab closes the loop: registry → Deployment → Service → `curl` via port-forward. The stand is the minikube profile `mock-exams` via [`mockctl`](../../mockctl/README.md); GitLab and the registry — [`deploy/gitlab`](../../deploy/gitlab/README.md).

**Preconditions:** [04-lab-build-push.md](04-lab-build-push.md), [05-deploy-kubernetes.md](05-deploy-kubernetes.md), `mockctl up`, an image in the registry.

## What you'll do

- Save the kubeconfig in a GitLab CI variable (File, protected).
- Create `imagePullSecrets` in the `hello-ci` namespace.
- Add a `deploy` job with `envsubst` and `rollout status`.
- Check the application and perform a rollback.

---

## Preparation on the host

```bash
cd /path/to/mock-exams
mockctl up
mockctl status

export KUBECONFIG="$(pwd)/output/kubeconfig.yaml"
kubectl create namespace hello-ci --dry-run=client -o yaml | kubectl apply -f -
kubectl get ns hello-ci
```

If you get `connection refused` — `mockctl kubeconfig` and repeat `kubectl get nodes`.

Kubeconfig in GitLab:

1. `cat output/kubeconfig.yaml`
2. **Settings → CI/CD → Variables → Add**
   - Key: `KUBECONFIG`, Type: **File**, **Protected**, **Masked** (if available)
3. Protect the `main` branch — otherwise the protected variable won't reach the job.

**Do not commit** the kubeconfig to Git. After each `mockctl down` / `up`, update the variable.

---

## Task 1. Manifests

In the repository [`k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml) with `${IMAGE}` and `imagePullSecrets: gitlab-reg` (see [05-deploy-kubernetes.md](05-deploy-kubernetes.md)).

Local check:

```bash
export IMAGE="localhost:8929/root/hello-ci:YOUR_SHA"
envsubst < k8s/deployment.yaml | kubectl apply -n hello-ci --dry-run=client -f -
```

`envsubst` substitutes `$IMAGE` — in CI it's the same, with `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`.

---

## Task 2. The deploy job

```yaml
stages:
  - validate
  - test
  - build
  - deploy

deploy-mockctl:
  stage: deploy
  needs: [docker-build]
  image:
    name: bitnami/kubectl:1.29
    entrypoint: [""]
  tags: [docker]
  variables:
    K8S_NAMESPACE: hello-ci
  script:
    - kubectl get nodes
    - |
      kubectl create secret docker-registry gitlab-reg \
        --docker-server="$CI_REGISTRY" \
        --docker-username="$CI_REGISTRY_USER" \
        --docker-password="$CI_REGISTRY_PASSWORD" \
        -n "$K8S_NAMESPACE" \
        --dry-run=client -o yaml | kubectl apply -f -
    - export IMAGE="$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA"
    - envsubst < k8s/deployment.yaml | kubectl apply -n "$K8S_NAMESPACE" -f -
    - kubectl rollout status deployment/hello-ci -n "$K8S_NAMESPACE" --timeout=180s
    - kubectl get pods -n "$K8S_NAMESPACE" -o wide
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

**Local stand — an important constraint:** a runner in Docker may not be able to reach the minikube API (`127.0.0.1` in the kubeconfig). Options:

| Option | When |
|---------|-------|
| (a) A shell runner on the host | more reliable for the learning stand |
| (b) `network_mode = "host"` in the runner config | Linux |
| (c) The server URL set to the minikube IP | `minikube ip -p mock-exams` in the kubeconfig |

Record the chosen option in the project README.

**Expected result:** the job is green, `deployment "hello-ci" successfully rolled out`.

---

## Task 3. Checking the application

```bash
kubectl get pods -n hello-ci
kubectl describe pod -n hello-ci -l app=hello-ci | grep -A2 "Image:"

kubectl port-forward -n hello-ci svc/hello-ci 8080:80
curl -s http://localhost:8080/ | head -5
```

The Image in describe = `$CI_COMMIT_SHA` of the last deploy. If you see `ImagePullBackOff` — see the errors section.

---

## Task 4. Rollback

Change `app/index.html`, run the pipeline, deploy. Then:

```bash
kubectl rollout history deployment/hello-ci -n hello-ci
kubectl rollout undo deployment/hello-ci -n hello-ci
kubectl rollout status deployment/hello-ci -n hello-ci
```

Alternative: redeploy a previous SHA from the registry (immutable tags). Add a **Rollback** section to the README.

---

## Task 5. (Bonus) Helm

Per [kuber-intermediate/08-lab-helm](../kuber-intermediate/08-lab-helm.md) — `helm upgrade --install` instead of `envsubst`:

```yaml
deploy-helm:
  image: alpine/helm:3.14
  script:
    - helm upgrade --install hello-ci ./chart \
        --namespace hello-ci --create-namespace \
        --set image.repository="$CI_REGISTRY_IMAGE" \
        --set image.tag="$CI_COMMIT_SHA" \
        --wait
```

Values per environment — [08-lab-environments.md](08-lab-environments.md).

---

## What went wrong

### `Unable to connect to the server`

**Cause:** the kubeconfig points to `127.0.0.1` — inside the runner container that isn't minikube.

**Fix:** host runner; update the server in the kubeconfig to the minikube IP; `mockctl kubeconfig`.

### ImagePullBackOff

**Cause:** the secret is missing, the `docker-server` is wrong, or the image wasn't pushed.

**Fix:** `kubectl describe pod` → Events; check the registry and the SHA.

### Rollout timeout

**Cause:** the image doesn't exist; crash loop; probe failure.

**Fix:** `kubectl logs deployment/hello-ci -n hello-ci`; check the registry.

### Deploy doesn't run on an MR

**Expected** with `rules: main only` — an MR only builds, not deploys.

### `envsubst: command not found`

**Fix:** `apk add --no-cache gettext` in `before_script` (the bitnami/kubectl image is on an alpine base).

---

## Summary

- Full loop: build → push → deploy to [`mockctl`](../../mockctl/README.md).
- Kubeconfig in a protected File variable; a secret to pull from the [`deploy/gitlab`](../../deploy/gitlab/README.md) registry.

---

## Success criteria

- [ ] Deploy green after `docker-build` on `main`
- [ ] Pod `Running`, image = `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA`
- [ ] `curl` via port-forward returns HTML
- [ ] `kubectl rollout undo` works
- [ ] Kubeconfig only in a CI variable
- [ ] README: rollback and the runner→API constraints

---

## Related material

| Next | Content |
|--------|------------|
| [07-environments.md](07-environments.md) | staging / production |
| [08-lab-environments.md](08-lab-environments.md) | two namespaces |
| [13-final-project.md](13-final-project.md) | the full pipeline |

Next lesson: [07-environments.md](07-environments.md).
