# CKA 23 — Cordon / drain

**Start** the lab, then complete the task. There is no walkthrough.

## Task

Take worker 1 out of service **without** application downtime.

Namespace `cka-23` has Deployment `web` and a PodDisruptionBudget.
Respect the PDB. DaemonSets and local storage are in play on a real node.

Leave the node cordoned when you finish. Cleanup will uncordon.

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
