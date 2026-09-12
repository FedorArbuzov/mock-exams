# 11. Lab: kubeadm upgrade

One **minor**: **1.31 → 1.32** (or two consecutive minors you actually installed). Never skip more than one minor in production.

## Order (memorize)

```text
1. etcd snapshot (lesson 09)
2. kubeadm upgrade plan
3. upgrade kubeadm package on cp, then: kubeadm upgrade apply v1.32.x
4. drain worker → upgrade kubeadm+kubelet → kubeadm upgrade node → restart kubelet → uncordon
5. next worker (Ansible serial: 1)
```

Control-plane node: upgrade **apply** once. Workers: **upgrade node** each.

## Task 1. Snapshot

Save `/root/etcd-pre-upgrade.db` on `cp` as in lesson 09.

## Task 2. Plan

On `cp`, after installing the **1.32** `kubeadm` package (repo line `v1.32`):

```bash
sudo kubeadm upgrade plan
sudo kubeadm upgrade apply v1.32.0   # use the version plan printed
```

Match the exact patch `plan` shows.

## Task 3. kubelet on cp

Install `kubelet`/`kubectl` 1.32 on `cp`, `sudo kubeadm upgrade node`, restart kubelet.

## Task 4. Workers with Ansible

Play: `hosts: k8s_workers`, `serial: 1`, `become: true`:

1. `kubectl drain {{ inventory_hostname }}` (`delegate_to: localhost` with your kubeconfig, **or** run drain from `cp`)
2. apt 1.32 kubeadm kubelet kubectl
3. `kubeadm upgrade node`
4. restart kubelet
5. uncordon

A first pass **by hand** on `w1` is fine; Ansible for `w2`.

## Task 5. Proof

```bash
kubectl get nodes
# VERSION column 1.32.x
kubectl get --raw /version
```

## If packages 404

Change minors in `group_vars` to whatever two consecutive versions exist on pkgs.k8s.io **today**. The procedure stays.

## Success criteria

- [ ] Snapshot exists from before apply
- [ ] All nodes show the new kubelet version
- [ ] You drained workers one at a time (not all at once)

Next: [12. Break-fix](12-lab-breakfix.md).
