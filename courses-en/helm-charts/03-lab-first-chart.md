# 03. Lab: first chart from `helm create`

## Setup

See [ENVIRONMENT.md](ENVIRONMENT.md).

```bash
helm version
kubectl config use-context docker-desktop
mkdir -p ~/helm-work && cd ~/helm-work
kubectl create namespace lab-helm
kubectl config set-context --current --namespace=lab-helm
```

## Task 1. Scaffold

```bash
helm create webshop
ls -R webshop
```

**Check:** you see `Chart.yaml`, `values.yaml`, `templates/deployment.yaml`, `templates/_helpers.tpl`.

## Task 2. Lint and render

```bash
helm lint ./webshop
helm template shop ./webshop | head -80
```

**Check:** lint is clean (or only warnings). Rendered YAML has a Deployment and Service.

## Task 3. Install

```bash
helm install shop ./webshop
helm list
kubectl get deploy,svc,pods -l app.kubernetes.io/instance=shop
```

**Check:** release `shop` is `deployed`; pods become Ready.

## Task 4. Upgrade with values

Create `dev-values.yaml`:

```yaml
replicaCount: 3
image:
  repository: nginx
  tag: 1.27-alpine
service:
  type: ClusterIP
  port: 80
```

```bash
helm upgrade shop ./webshop -f dev-values.yaml
kubectl get pods -l app.kubernetes.io/instance=shop
```

**Check:** three replicas; image tag `1.27-alpine`.

## Task 5. Second release

```bash
helm install shop-canary ./webshop --set replicaCount=1 --set image.tag=1.28-alpine
helm list
```

**Check:** two releases in the same namespace, different pod counts/tags.

## Task 6. History and rollback

```bash
helm upgrade shop ./webshop -f dev-values.yaml --set image.tag=1.28-alpine
helm history shop
helm rollback shop 1
helm history shop
```

**Check:** a new revision appears after rollback; pods return toward the earlier config.

## Task 7. Uninstall

```bash
helm uninstall shop-canary
helm uninstall shop
kubectl get all
kubectl delete namespace lab-helm
kubectl config set-context --current --namespace=default
```

## Self-check

1. What does `app.kubernetes.io/instance=shop` label mean?
2. Why can two releases of the same chart coexist?
3. What does `helm template` *not* do?

Next: [04-template-language.md](04-template-language.md).
