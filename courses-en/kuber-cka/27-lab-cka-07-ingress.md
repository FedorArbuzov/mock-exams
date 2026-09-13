# CKA 07 — Ingress

**Start** the lab, then complete the task. There is no walkthrough.

## Task

Namespace `cka-07` has Deployment and Service `frontend`.

Configure HTTP routing:

```text
app.example.com
        ↓
frontend
```

Create Ingress `app` in `cka-07`. Use the IngressClass your controller expects.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
