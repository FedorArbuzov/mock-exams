# CKA 05 — Taints / tolerations

**Start** the lab, then complete the task. There is no walkthrough.

## Task

A worker node has a taint for this lab.

Create a Pod named `tainted-ok` in namespace `cka-05` (image `nginx:1.27`)
that runs **on that tainted worker**. You must use a correct toleration.

Do not remove the taint.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
