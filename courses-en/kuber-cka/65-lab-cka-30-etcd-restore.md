# CKA 30 — etcd restore

**Start** the lab, then complete the task. There is no walkthrough.

## Task

etcd data has been disturbed. A snapshot is at `~/kuber-cka/etcd-snapshot.db`.

Restore the control plane from that backup.
Verify etcd → API Server → objects → workloads.

This is the most dangerous lab on the stand. Read the Kubespray / etcd restore
notes before you start. **Cleanup does not invent a new etcd for you.**

**Check** grades the resulting cluster state — not the commands you typed.
**Cleanup** when you are done or before the next lab.
