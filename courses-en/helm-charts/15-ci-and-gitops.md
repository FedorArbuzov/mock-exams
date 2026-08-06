# 15. Helm in CI and GitOps

## Patterns

### A. CI applies Helm (push / “clickops-ish”)

Pipeline:

1. `helm lint` + `helm template` (and optionally kubeconform)
2. build/push image → set `image.tag`
3. `helm upgrade --install … --wait`

Pros: simple. Cons: cluster credentials in CI; drift if someone kubectl-ed by hand.

### B. CI packages; GitOps applies (recommended at scale)

Pipeline:

1. lint/template/test
2. `helm package` + `helm push oci://…`
3. bump version in an **Application** / values repo
4. Argo CD / Flux reconciles

Pros: Git (or OCI+Git) is source of truth; PRs review desired state. Cons: more moving parts.

See [`gitops-basic`](../gitops-basic/README.md) and [`gitops-intermediate`](../gitops-intermediate/README.md).

## Minimal CI snippet (conceptual)

```yaml
script:
  - helm lint ./charts/webshop
  - helm template webshop ./charts/webshop -f deploy/webshop/values-prod.yaml > /tmp/man.yaml
  - helm upgrade --install webshop ./charts/webshop
      -n webshop --create-namespace
      -f deploy/webshop/values-prod.yaml
      --set image.tag=$CI_COMMIT_SHORT_SHA
      --wait --timeout 5m
```

## Argo CD + Helm

Argo can render Helm charts from Git (`source.path` + `helm.valueFiles`) or from OCI. Prefer **values in Git**, image tags via CI commit to values or via an image updater.

Hooks vs Argo: prefer Argo **sync waves** / PreSync Jobs for migrations when Argo owns the deploy.

## Policy checklist for teams

- Immutable image tags.
- No prod secrets in Git values.
- Chart version bumps reviewed in PR.
- `helm diff` / Argo diff required before prod.
- Separate releases per service (avoid giant umbrellas unless you mean it).

## Checklist

- CI-apply vs GitOps-apply tradeoffs.
- Where image digests/tags are set.
- Why lint+template belong in every PR.

Final: [16-final-project.md](16-final-project.md).
