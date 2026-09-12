# 12. Lab: break kubelet or CNI

Pick **one** fault, fix it without `vagrant destroy`.

## Option A — kubelet down

On `w2`:

```bash
sudo systemctl stop kubelet
```

From the laptop:

```bash
kubectl get nodes
# w2 NotReady
```

Fix: `sudo systemctl start kubelet` (and `enable` if it was disabled). `journalctl -u kubelet -e` if it will not stay up.

## Option B — CNI gone

```bash
kubectl delete -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
kubectl get nodes
```

Nodes go `NotReady`; new Pods pending. Restore the same Flannel manifest. Do not install Calico on top of a half-deleted Flannel.

## Option C — wrong join leftover

On a worker, `sudo kubeadm reset -f`, node disappears from the API (or stays `NotReady`). Join again with a **fresh** token.

## Success criteria

- [ ] You observed NotReady **before** fixing
- [ ] Three Ready after
- [ ] You used `journalctl` or `kubectl describe node` at least once (not only restart)

Next: [13. What we skipped](13-what-we-skipped.md).
