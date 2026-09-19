# 15. Replace a worker

You do not have a fourth LXC. Production often does not either: the disk died, the **same** name and IP come back as a new OS.

```text
drain node-03
Kubespray remove-node.yml
reset Kubernetes on that host (or recycle the LXC)
nimbus-ops: common + users + hygiene
Kubespray scale.yml
nimbus-ops: labels from host_vars
```

If you `scale.yml` first, you still have a ghost member. If you skip `common`, Lena’s key is missing on the new disk.

## Kubespray playbooks (venv)

Exact extra-vars differ by release. For **v2.27.0** the usual shape is:

```text
# from ~/kubespray, venv on
ansible-playbook -i inventory/lab/hosts.yaml remove-node.yml \
  -e "node=node-03" -e "skip_confirmation=true" -b

ansible-playbook -i inventory/lab/hosts.yaml reset.yml --limit node-03 -b
```

Then fix the OS (re-run `common` / `users` / `hygiene`, or `lxc restart` / recreate the container with the **same** name and `192.168.56.13` — this course stays on `.12`).

```text
ansible-playbook -i inventory/lab/hosts.yaml scale.yml -b
```

`scale.yml` joins hosts that are in inventory but not in the cluster. Keep `node-03` **in** `hosts.yaml` the whole time — you are replacing, not shrinking the inventory.

If `remove-node.yml` asks for a confirmation variable you did not set, read the playbook header — do not `-e confirm=yes` from a blog for a different version.

## Labels are yours

Kubespray will not put `workload=app` back. `playbooks/node-labels.yml` reads `host_vars`:

```yaml
# host_vars/node-02.yml
node_labels:
  workload: app

# host_vars/node-03.yml
node_labels:
  workload: batch
```

`kubectl label node {{ inventory_hostname }} {{ key }}={{ value }} --overwrite` in a loop. Optional taints on `node-01` if you want to **assert** `NoSchedule` on the control plane (kubeadm/Kubespray usually already set it — the play should be idempotent).

## Checklist

- [ ] Order: drain → remove-node → OS → nimbus-ops baseline → scale → labels
- [ ] Same hostname/IP is a replace, not a scale-out
- [ ] Labels live in `host_vars`, not in someone’s notes

Next: [16. Lab: node-03 disk died](16-lab-replace.md).
