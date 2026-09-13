# CKA 09 — ConfigMap

**Start** the lab, then complete the task. There is no walkthrough.

## Task

In namespace `cka-09`:

- Create ConfigMap `app-config` with key `COLOR=blue`.
- Create Deployment `web` (`nginx:1.27`) that uses that ConfigMap
  (env, envFrom, or a mounted file — any correct use).

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
