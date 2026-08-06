# 01. Why Helm (vs raw YAML and Kustomize)

## The problem

A real app is rarely one Deployment. You end up with:

- Deployment, Service, Ingress, ConfigMap, Secret, HPA, PDB, ServiceAccount…
- small differences between `dev` / `stage` / `prod` (replicas, image tag, host, resources)
- third-party components (Postgres, Redis, ingress-nginx) with dozens of knobs

Copy-pasting YAML folders per environment drifts. `sed` in CI is fragile. You need **packaging + parameterization + a release story**.

## What Helm is

**Helm** is the de-facto package manager for Kubernetes:

| Idea | Meaning |
|------|---------|
| **Chart** | A versioned package of templates + default values |
| **Release** | One installed instance of a chart in a cluster/namespace |
| **Values** | Parameters that fill the templates |
| **Repository / OCI** | Where charts are published |

Helm renders templates → YAML, then applies them (create/update/delete) and stores **release history** (usually as Secrets in the namespace).

## Helm vs plain kubectl

| | `kubectl apply -f` | Helm |
|--|-------------------|------|
| Parameterization | manual / envsubst | `values.yaml` + `--set` / `-f` |
| History | none (Git only) | `helm history` / `rollback` |
| Third-party apps | vendor YAML dumps | `helm install bitnami/…` |
| Cleanup | delete files carefully | `helm uninstall` removes release resources |
| Diff before apply | `kubectl diff` | `helm template` / `helm diff` (plugin) |

Helm does **not** replace Git. Charts and values still belong in Git (or an OCI registry).

## Helm vs Kustomize

| | Helm | Kustomize |
|--|------|-----------|
| Model | templates (`{{ }}`) | patches / overlays on base YAML |
| Logic | conditionals, loops, helpers | mostly declarative patches |
| Packaging | charts, deps, versioning | bases + overlays; weaker “package” story |
| Third-party | excellent (huge chart ecosystem) | often wrap vendor YAML |
| Learning curve | steeper (template language) | gentler if you already have YAML |

**Rule of thumb:**

- Packaging an **application** with options and dependencies → **Helm**.
- Small overlays on **your** YAML without a template language → **Kustomize**.
- Many teams use **both**: Helm for apps, Kustomize for cluster bootstrap — or Helm only.

## Anti-patterns

- Putting secrets in `values.yaml` committed to Git.
- One mega-chart for every microservice in the company (umbrella that nobody owns).
- Editing rendered YAML in the cluster and never upgrading the chart.
- Using Helm hooks for business logic that belongs in the app or a Job controller.

## Checklist

- Chart vs release vs values.
- When Helm beats raw `kubectl apply`.
- When Kustomize is enough.
- Why Helm still needs Git (or OCI) as source of truth.

Next: [02-chart-anatomy.md](02-chart-anatomy.md).
