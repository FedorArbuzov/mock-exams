# CKA 11 — PVC

**Start** the lab, then complete the task. There is no walkthrough.

## Task

In namespace `cka-11`:

- Create PVC `data`: `1Gi`, `ReadWriteOnce`.
- Create Pod `keeper` (`nginx:1.27`) that mounts it at `/data`.

The PVC must be Bound. The Pod must be Running.

Persistence: after you write a file under `/data`, it must survive a Pod delete/recreate
using the same PVC (the grader checks the mount, not the file contents).

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
