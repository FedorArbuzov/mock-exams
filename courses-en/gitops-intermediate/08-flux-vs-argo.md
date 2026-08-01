# 08. Flux CD vs Argo CD

## Two GitOps ecosystems

| | **Argo CD** | **Flux CD** |
|---|-------------|-------------|
| Model | Application CR (pull UI) | GitRepository + Kustomization/HelmRelease |
| UI | built-in, rich | Flux UI / Weave GitOps (optional) |
| Multi-tenancy | AppProject | namespace-scoped controllers |
| Helm | built into Application | HelmRelease CR |
| Popularity | platform teams, visualization | CNCF Graduated, GitOps Toolkit |

## Flux — minimal scheme

```text
GitRepository  →  reference to repo/branch
Kustomization  →  path + prune + target namespace
```

Examples in the repository (for reference, do **not** install on the same mockctl alongside Argo without isolation):

- [`examples/flux-gitrepository.yaml`](../../deploy/gitops/examples/flux-gitrepository.yaml)
- [`examples/flux-kustomization.yaml`](../../deploy/gitops/examples/flux-kustomization.yaml)

Installing Flux (separately):

```bash
flux install
flux create source git ...
flux create kustomization ...
```

## When to choose what

| Situation | Common choice |
|----------|--------------|
| Need a UI for SRE/on-call | Argo CD |
| Controllers only, GitOps Toolkit | Flux |
| Already GitLab + split CI | both work; in mock-exams — **Argo** |

Course stand: **Argo CD** on mockctl ([`deploy/gitops`](../../deploy/gitops/README.md)).

## Checklist

- How is an Argo Application similar to a Flux Kustomization?
- Why is running two controllers on the same namespace a bad idea?

Next lesson: [09-split-ci-cd.md](09-split-ci-cd.md).
