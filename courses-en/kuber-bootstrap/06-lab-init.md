# 06. Lab: `kubeadm init` by hand

Run init **on `cp` over SSH**. Do not hide it in Ansible yet.

## Task 1. Pick the right IP

```bash
vagrant ssh cp -- ip -4 addr
```

Use **192.168.56.10** (`eth1` / `enp0s8`), not the VirtualBox NAT address.

## Task 2. Init

```bash
vagrant ssh cp
sudo kubeadm init \
  --apiserver-advertise-address=192.168.56.10 \
  --pod-network-cidr=10.244.0.0/16 \
  --kubernetes-version=v1.31.0
```

If `v1.31.0` is missing, `kubeadm version` and pass that exact version.

**Save the `kubeadm join` command** the tool prints. You need it in lesson 08 (or regenerate with `kubeadm token create --print-join-command`).

## Task 3. kubeconfig on cp and on the laptop

On `cp`:

```bash
mkdir -p $HOME/.kube
sudo cp /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown "$(id -u):$(id -g)" $HOME/.kube/config
kubectl get nodes
kubectl get pods -n kube-system
```

`cp` is `NotReady`. CoreDNS is `Pending` until CNI.

On the **host** (ENVIRONMENT.md): copy `admin.conf`, set `server: https://192.168.56.10:6443`, `export KUBECONFIG=...`, `kubectl get nodes`.

## If init fails

| Message | Likely |
|---------|--------|
| swap | role 04 did not stick; `swapon --show` |
| CRI | containerd down |
| port 6443 | leftover from a previous init — `sudo kubeadm reset -f` and retry |
| advertise-address | you used NAT IP |

`kubeadm reset -f` wipes `/etc/kubernetes` on that node. Workers are still empty.

## Success criteria

- [ ] Init finished without reset-loop
- [ ] `kubectl get nodes` from laptop shows `cp` (NotReady is OK)
- [ ] You still have a join command (or know how to print a new one)

Next: [07. CNI](07-cni.md).
