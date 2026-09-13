# CKA 03 — Rolling update

**Start** the lab, then complete the task. There is no walkthrough.

## Task

Namespace `cka-03` already has Deployment `frontend` on `nginx:1.26`.

Update the image to `nginx:1.27`. Keep 3 replicas. The rollout must complete.
Rollout history must remain (do not delete old ReplicaSets).

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
