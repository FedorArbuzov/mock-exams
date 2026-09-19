# 16. Lab: node-03 disk died

## Ticket

P1 — hardware

`node-03` disk is gone (for the lab: you will pretend, then recycle the node). Bring **the same** name and IP back. Put `workload=batch` on it from inventory. `node-02` stays `workload=app`.

## Task 1. Labels playbook first

Write `playbooks/node-labels.yml` **before** you break the node. Apply it. Prove:

```bash
kubectl get nodes --show-labels
```

Author picture: [`examples/playbooks/node-labels.yml`](examples/playbooks/node-labels.yml), [`examples/host_vars/`](examples/host_vars/node-02.yml).

## Task 2. Take node-03 out

```text
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
kubectl drain node-03 --ignore-daemonsets --delete-emptydir-data
```

Then Kubespray **venv**: `remove-node.yml` for `node-03`. Confirm the API no longer lists it (or lists it only until you delete the Node object — follow what the playbook did).

`reset.yml --limit node-03` **or** recreate the LXC:

```bash
# only if you choose recycle — same IP .12
# lxc delete --force node-03 && launch + SSH as in lesson 02
```

If you only `reset.yml`, the Ubuntu user and your `common` state may survive; still re-run `site.yml` so you practice the order.

## Task 3. OS + scale

```bash
cd ~/nimbus-ops
ansible-playbook site.yml --limit node-03
```

Then `scale.yml` from `~/kubespray` against `inventory/lab`. Wait until `node-03` is Ready.

```bash
cd ~/nimbus-ops
ansible-playbook playbooks/node-labels.yml
```

## Task 4. Proof

A smoke Pod with `nodeSelector: workload: batch` must land on `node-03`, not `node-02`. Delete the Pod when done.

## Success criteria

- [ ] three Ready nodes, `.12` is still `node-03`
- [ ] labels `workload=app` / `workload=batch` match `host_vars`
- [ ] batch smoke Pod on `node-03`
- [ ] README: replace order in six bullets

Next: [17. Runbooks](17-runbooks.md).
