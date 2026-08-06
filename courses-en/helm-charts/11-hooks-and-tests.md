# 11. Hooks, tests, and upgrade pitfalls

## Hooks

Helm can run Jobs (or other resources) at specific points:

| Annotation | When |
|------------|------|
| `pre-install` | before resources are created |
| `post-install` | after install |
| `pre-upgrade` / `post-upgrade` | around upgrades |
| `pre-delete` / `post-delete` | around uninstall |
| `pre-rollback` / `post-rollback` | around rollback |

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: "{{ include "shop.fullname" . }}-migrate"
  annotations:
    "helm.sh/hook": pre-upgrade,pre-install
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": before-hook-creation,hook-succeeded
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: migrate
          image: busybox:1.36
          command: ["sh","-c","echo migrate && sleep 2"]
```

Weights order hooks (lower runs first). Delete policies avoid leftover Jobs.

## When hooks are appropriate

- DB schema migrate Job before new pods start.
- Smoke seed data (careful in prod).

## When to avoid hooks

- Long-running logic (use Controllers / CronJobs).
- Anything that must work with `helm template` only / GitOps tools that ignore hooks differently (Argo CD has its own story — sync waves often replace hooks).

## `helm test`

Files under `templates/tests/` with hook `test`:

```bash
helm test shop -n lab
```

Useful for post-install connectivity checks. Keep tests fast and non-destructive.

## Upgrade pitfalls

| Pitfall | Mitigation |
|---------|------------|
| Immutable fields (Service `clusterIP`, PVC size down) | plan upgrades; sometimes delete+recreate |
| Selector label changes | never change selector labels casually |
| CRDs | Helm does not always upgrade CRDs the way you expect — read docs |
| `--wait` timeouts | set realistic `--timeout`; fix readiness probes |
| Partial failure | `helm history` + `rollback`; fix chart; upgrade again |

## Three-way merge

Helm 3 tracks the last applied release and merges live cluster state. Manual `kubectl edit` can surprise you on the next upgrade — prefer changing the chart/values.

## Checklist

- Hook types and weights.
- Delete policies.
- Why GitOps may prefer sync waves over Helm hooks.
- Immutable field / selector upgrade traps.

Lab: [12-lab-hooks.md](12-lab-hooks.md).
