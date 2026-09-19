# 18. Lab: DiskPressure

## Ticket

P1

**DiskPressure**

`node-02` is under disk pressure (or will be, after you seed it). Restore Ready. Keep the evidence.

## Task 1. Runbooks exist first

Write `playbooks/runbooks/disk-gc.yml` and `playbooks/runbooks/gather.yml` **before** you fill the disk. Tags `runbook` / `gather`.

Author picture: [`examples/playbooks/runbooks/`](examples/playbooks/runbooks/disk-gc.yml).

## Task 2. Seed (lab only)

On `node-02` only, create a large junk file so `df` looks ugly. Stay inside `/var/tmp` or `/var/log` — **not** `/var/lib/etcd`, **not** `/var/lib/containerd`.

```bash
# size: enough to see the file; do not fill the LXD pool to 100%
ansible node-02 -b -m shell -a 'dd if=/dev/zero of=/var/tmp/nimbus-junk bs=1M count=512'
```

512M is enough to practice. If the node actually goes NotReady, good; if it only looks messy, still run the runbook and delete the junk file in the playbook (`file: state=absent` for `/var/tmp/nimbus-junk`).

Optional: `playbooks/runbooks/break-disk.yml` that only exists in the lab — never on a shared runner.

## Task 3. Close the incident

```bash
cd ~/nimbus-ops
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
ansible-playbook playbooks/runbooks/gather.yml --limit node-02
ansible-playbook playbooks/runbooks/disk-gc.yml --limit node-02
ansible-playbook playbooks/runbooks/disk-gc.yml --limit node-02
```

Second `disk-gc` must not destroy anything. `kubectl get nodes` — `node-02` Ready, no DiskPressure.

## Success criteria

- [ ] `artifacts/` has kubelet/containerd journal from `node-02`
- [ ] junk file gone; gc script ran
- [ ] three Ready
- [ ] hygiene timer from lab 10 still enabled (you did not “fix” by disabling it)

Next: [18b. Lab: etcd / control plane down](18b-lab-etcd.md).
