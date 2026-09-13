# CKA 01 — Create a Pod

**Start** the lab, then complete the task. There is no walkthrough.

## Task

Create a Pod named `nginx` in namespace `cka-01`.

Requirements:

- image: `nginx:1.27`
- container port: `80`
- requests: cpu `50m`, memory `64Mi`
- limits: cpu `200m`, memory `128Mi`

The Pod must become Running.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
