# CKA 08 — NetworkPolicy

**Start** the lab, then complete the task. There is no walkthrough.

## Task

In namespace `cka-08` implement:

```text
frontend → backend = ALLOW
backend → redis    = ALLOW
frontend → redis   = DENY
```

Create Pods or Deployments labeled `app=frontend`, `app=backend`, `app=redis`
(nginx / redis images are fine).

NetworkPolicies must be named:

- `allow-frontend-to-backend`
- `allow-backend-to-redis`
- `deny-frontend-to-redis`

(A default-deny plus two allow policies is fine if those three names exist —
the deny object may be a default-deny that excludes redis from frontend.)

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
