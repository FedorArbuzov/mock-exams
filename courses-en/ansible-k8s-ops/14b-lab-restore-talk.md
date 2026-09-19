# 14b. Lab: restore order (do not run it)

## Ticket

P2 — interview

You have a kit from lesson 14. A full `etcdctl snapshot restore` on this **one**-CP stand is how you brick the lab. You still must **write** the procedure.

## Task

In `~/nimbus-ops/README.md`, six to ten bullets. Typical shape (adjust to kubeadm/Kubespray docs you actually opened):

```text
1. cluster is dead — API gone, not “one worker NotReady”
2. new or wiped node-01, same IP if the inventory says so
3. restore etcd.db to a new data-dir (not the live one while static Pods run)
4. put PKI back under /etc/kubernetes/pki
5. start etcd / static Pods
6. kubectl get nodes — only then workers
```

Link the **upstream** page you copied from. Do not execute restore on a healthy cluster.

`etcdutl snapshot status` on the kit — already green from lesson 14 — is the only command in this lab.

## Success criteria

- [ ] restore order in the README
- [ ] three Ready still
- [ ] you did not `snapshot restore` onto `/var/lib/etcd`

Next: [15. Replace a worker](15-replace-node.md).
