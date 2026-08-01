# 12. The Operator pattern and kubebuilder

## The pattern

```text
CRD (Tenant)  →  Controller (watch)  →  reconcile loop  →  create Namespace, RBAC, ...
```

1. A user creates a `Tenant` CR.
2. The controller sees the event.
3. It compares desired (spec) vs actual (what's in the cluster).
4. It creates/updates/deletes the dependent objects.
5. It writes the status (phase, conditions).

## kubebuilder

A framework for generating a Go operator:

```bash
kubebuilder init --domain example.com --repo github.com/you/project
kubebuilder create api --group example --version v1 --kind Tenant
make install   # CRD into the cluster
make run       # controller locally
```

Requires Go 1.21+ on the host.

## Alternatives

- **Operator SDK** (Red Hat)
- **Kopf** (Python)
- **shell-operator** (bash)

## When to use an operator

- A complex lifecycle (databases: backup, failover, upgrade).
- Domain logic like "if a Tenant is created → create 5 objects".
- Not for a simple Deployment — Helm/Argo is enough.

## Checklist

- What is a reconcile loop?
- How does a CRD differ from a controller?
- Why the `.status` subresource?

Lab: [13-lab-operator.md](13-lab-operator.md).
