# Helm Charts

Course for **DevOps / Platform / Backend** engineers who already use Kubernetes and want to **author** Helm charts — not only `helm install` someone else’s chart.

**Prerequisites:** [`kuber-basic`](../kuber-basic/README.md) (Deployment, Service, Ingress). Helpful: [`kuber-intermediate`](../kuber-intermediate/README.md) storage / RBAC basics. Cluster: Docker Desktop Kubernetes + courses UI — see [ENVIRONMENT.md](ENVIRONMENT.md) and [QUICKSTART.md](../../QUICKSTART.md).

A short consumer intro still lives in [`kuber-intermediate/07–08`](../kuber-intermediate/07-helm.md). **This course is the deep authoring track.**

**Next:** [`gitops-basic`](../gitops-basic/README.md) (Helm as an Argo CD source), [`gitlab-intermediate`](../gitlab-intermediate/README.md) (Helm in CI).

## How to read

1. **Theory** — concepts, anti-patterns, command cheat sheets.
2. **Lab** — build charts under `~/helm-work` (or any directory), install into a lab namespace.
3. Prefer `helm template` / `--dry-run` before every real install.

**Time:** ~30–45 min per theory+lab pair; final project **2–3 h**. Full course **~12–16 h**.

## Curriculum

### Foundations (01–03)

1. [Why Helm (vs raw YAML and Kustomize)](01-why-helm.md)
2. [Chart anatomy and releases](02-chart-anatomy.md)
3. [Lab: first chart from `helm create`](03-lab-first-chart.md)

### Templating (04–06)

4. [Template language: actions, Sprig, scoping](04-template-language.md)
5. [Helpers, labels, and naming](05-helpers-and-labels.md)
6. [Lab: `_helpers.tpl` and stable selectors](06-lab-helpers.md)

### Values and environments (07–08)

7. [Values, overlays, and secrets hygiene](07-values-and-overrides.md)
8. [Lab: `values-dev` / `values-prod`](08-lab-env-values.md)

### Dependencies (09–10)

9. [Chart dependencies and umbrella charts](09-dependencies.md)
10. [Lab: app + Bitnami PostgreSQL subchart](10-lab-dependency.md)

### Lifecycle and delivery (11–15)

11. [Hooks, tests, and upgrade pitfalls](11-hooks-and-tests.md)
12. [Lab: pre-upgrade Job hook](12-lab-hooks.md)
13. [Packaging, repos, and OCI](13-packaging-oci.md)
14. [Lab: `helm package` and local OCI registry](14-lab-package.md)
15. [Helm in CI and GitOps](15-ci-and-gitops.md)

### Capstone

16. [Final project: ship a reusable app chart](16-final-project.md)

## What you should end up with

- Design a chart with clear `values.yaml` schema and `_helpers.tpl`.
- Render and lint before apply; explain release history and rollback.
- Override values per environment without forking charts.
- Declare dependencies and understand subchart value keys.
- Use hooks carefully; know when not to use them.
- Package a chart and push to an OCI registry.
- Choose Helm vs Kustomize vs GitOps for a given workflow.

## Related materials

| Course | Relation |
|--------|----------|
| [kuber-intermediate/07–08](../kuber-intermediate/07-helm.md) | short consumer intro |
| [gitops-basic](../gitops-basic/README.md) | deploy charts via Argo CD |
| [gitops-intermediate](../gitops-intermediate/README.md) | Helm as Application source |
| [gitlab-intermediate](../gitlab-intermediate/README.md) | Helm upgrade in pipelines |
