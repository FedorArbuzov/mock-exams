# CKA 06 — Service

**Start** the lab, then complete the task. There is no walkthrough.

## Task

Namespace `cka-06` has a healthy backend Deployment (labels include `app=backend`).

Create a ClusterIP Service named `backend-svc`:

- selector: `app=backend`
- port: `80`
- targetPort: `80`

EndpointSlices must be populated. The Service must be reachable from another Pod in the cluster.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
