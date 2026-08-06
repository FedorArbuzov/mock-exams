# 16. Final project: ship a reusable app chart

Build a small but “real” chart you could hand to another team.

## Goal

Chart name: **`nimbus`**. It deploys:

- Deployment (`web`) — `nginx` serving a ConfigMap-mounted page
- Service (ClusterIP)
- optional Ingress (values-gated)
- optional Postgres dependency (Bitnami, values-gated, persistence off for local)
- `_helpers.tpl` with stable selector labels
- `values-dev.yaml` / `values-prod.yaml` overlays **outside** the chart (sibling folder)

Namespace: `lab-helm-final`.

## Setup

```bash
kubectl config use-context docker-desktop
mkdir -p ~/helm-work/nimbus-final && cd ~/helm-work/nimbus-final
kubectl create namespace lab-helm-final
kubectl config set-context --current --namespace=lab-helm-final
```

If you use Ingress, install ingress-nginx once (NodePort 32080) — see [`kuber-basic/ENVIRONMENT.md`](../kuber-basic/ENVIRONMENT.md).

## Requirements

### Chart

```text
nimbus/
  Chart.yaml          # version >= 0.1.0, optional postgresql dependency
  values.yaml         # safe defaults; ingress.enabled=false; postgresql.enabled=false
  templates/
    _helpers.tpl
    deployment.yaml
    service.yaml
    configmap.yaml
    ingress.yaml      # only if .Values.ingress.enabled
    NOTES.txt
  charts/             # after helm dependency update (if used)
```

### Behavior

1. `helm lint ./nimbus` passes.
2. `helm template nimbus ./nimbus` renders valid YAML.
3. ConfigMap key `index.html` contains **Nimbus Helm** and is mounted into nginx html dir.
4. Overlays:
   - `values-dev.yaml` → `replicaCount: 2`
   - `values-prod.yaml` → `replicaCount: 3` and resources requests/limits set
5. Install with prod overlay; pods Ready; `kubectl port-forward svc/… 8080:80` shows the page.
6. Optional stretch: enable Postgres subchart with `condition` and a generated password via values (local only).
7. Optional stretch: `pre-upgrade` migrate hook Job that echoes and exits 0.
8. `helm package ./nimbus` produces a `.tgz`.

## Suggested commands

```bash
helm create nimbus
# edit templates/values/Chart.yaml…
helm dependency update ./nimbus   # if using postgres
helm lint ./nimbus
helm upgrade --install nimbus ./nimbus -n lab-helm-final -f values-prod.yaml --wait
kubectl port-forward svc/nimbus 8080:80
# browser http://127.0.0.1:8080
helm package ./nimbus
```

## Success criteria

- [ ] Helpers used for name + selector labels on Deployment and Service  
- [ ] ConfigMap-driven page visible via port-forward  
- [ ] Dev/prod overlays change replicas as specified  
- [ ] Lint + package succeed  
- [ ] Uninstall cleans the release  

## Cleanup

```bash
helm uninstall nimbus -n lab-helm-final
kubectl delete namespace lab-helm-final
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. Why are selector labels not taken from `fullnameOverride` alone?
2. Where should environment-specific hostnames live — chart `values.yaml` or overlay files?
3. When would you push this chart to OCI instead of applying from a Git path?

## Next

- [`gitops-basic`](../gitops-basic/README.md) — deploy the chart with Argo CD  
- [`gitlab-intermediate`](../gitlab-intermediate/README.md) — `helm upgrade` in a pipeline  
