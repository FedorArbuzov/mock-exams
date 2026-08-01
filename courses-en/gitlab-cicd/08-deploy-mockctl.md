# 08. Deploy to mockctl

## Real-world scenario

A green build that never reaches a cluster is half a pipeline. You will deploy with `kubectl` from a CI job into the local minikube API using a **File** variable `KUBECONFIG`.

## Wire the cluster into GitLab

1. `mockctl kubeconfig` (refresh after Docker restarts).  
2. GitLab → Settings → CI/CD → Variables:  
   - Key: `KUBECONFIG`  
   - Type: **File**  
   - Protected (and protect `main`)  
3. Job image with kubectl, e.g. `bitnami/kubectl:1.29` with `entrypoint: [""]`.

From a Docker runner on the host network / `host.docker.internal`, the API server address inside the kubeconfig must be reachable. If jobs fail with connection errors, rewrite the server URL to `https://host.docker.internal:<port>` (port from `kubectl cluster-info` / kubeconfig) — document what you did in the project README.

## Manifests

Use `${IMAGE}` substitution (`envsubst` or `sed`):

See [`examples/k8s-deploy/k8s/deployment.yaml`](examples/k8s-deploy/k8s/deployment.yaml). Create `imagePullSecrets` (`gitlab-reg`) so nodes can pull from GitLab registry.

```bash
kubectl create namespace app-staging --dry-run=client -o yaml | kubectl apply -f -
kubectl -n app-staging create secret docker-registry gitlab-reg \
  --docker-server="$CI_REGISTRY" \
  --docker-username="$CI_REGISTRY_USER" \
  --docker-password="$CI_REGISTRY_PASSWORD" \
  --dry-run=client -o yaml | kubectl apply -f -
envsubst < k8s/deployment.yaml | kubectl apply -n app-staging -f -
kubectl -n app-staging rollout status deploy/hello-ci
```

## Checklist

- [ ] Kubeconfig is a File variable, not a Git file  
- [ ] Deploy waits on rollout  
- [ ] ImagePullBackOff → pull secret / wrong tag  

## Next

[09 — Environments and review apps](09-environments-review-apps.md)
