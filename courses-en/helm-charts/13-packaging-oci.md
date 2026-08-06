# 13. Packaging, repos, and OCI

## Classic chart repositories

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo ingress-nginx
helm pull bitnami/nginx --version 15.0.0
```

A repo is an HTTP index of chart tarballs. Fine for public charts; auth and caching vary by vendor.

## Package locally

```bash
helm package ./webshop            # → webshop-0.1.0.tgz
helm lint webshop-0.1.0.tgz
```

Bump `version` in `Chart.yaml` before packaging a new release.

## OCI registries

Modern default for private charts: push to an **OCI** registry (GHCR, ECR, Harbor, Docker Hub):

```bash
helm registry login ghcr.io -u USER --password-stdin

helm package ./webshop
helm push webshop-0.1.0.tgz oci://ghcr.io/ORG/charts
helm pull oci://ghcr.io/ORG/charts/webshop --version 0.1.0
helm install shop oci://ghcr.io/ORG/charts/webshop --version 0.1.0
```

Dependencies can also use `repository: oci://…`.

## Provenance (optional)

```bash
helm package --sign ./webshop
helm verify webshop-0.1.0.tgz
```

Useful for supply-chain policies; many teams start with OCI + CI attestations instead.

## Versioning policy

- **Chart `version`:** SemVer for the package (templates/values changes).
- **`appVersion`:** upstream app / image lineage.
- Tag images immutably (`1.2.3`, not `latest`) and pass the tag via values.

## Checklist

- `helm package` / `push` / `pull` OCI flow.
- Why chart version ≠ image tag.
- When to use `helm repo` vs OCI.

Lab: [14-lab-package.md](14-lab-package.md).
