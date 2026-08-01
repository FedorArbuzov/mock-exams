# 07. Preparing a Kubernetes worker node

## Intro: "kubeadm join succeeded, pod Pending — node NotReady"

A common story: a VM was prepared "like an ordinary server", the cluster join succeeds, but **Calico/Flannel won't start**, kubelet is **NotReady**, and pods won't schedule. The causes are at the Linux level: **swap enabled**, no **br_netfilter**, **ip_forward=0**, firewall blocking **10250**, the wrong **containerd** for CRI.

This chapter is a checklist of **Linux prerequisites** for a worker/control plane before `kubeadm` / a managed node group.

## What you'll learn

- Disabling **swap** and why kubelet requires it.
- The **br_netfilter**, **overlay** modules.
- **sysctl** for bridge and forwarding.
- Ports and firewall.
- **containerd** + CRI.
- The [verify-node.sh](examples/verify-node.sh) script.

---

## Node checklist

| # | Action | Criticality |
|---|----------|-------------|
| 1 | Disable **swap** | mandatory (kubelet default) |
| 2 | `modprobe br_netfilter`, `overlay` | for pod networking |
| 3 | **sysctl** bridge-nf, ip_forward | for iptables/ipvs CNI |
| 4 | **chrony**/NTP | certificates, etcd |
| 5 | Hostname, DNS, `/etc/hosts` | join, TLS |
| 6 | **containerd** + default CRI socket | kubelet → runtime |
| 7 | kubelet, kubeadm join / cloud init | after items 1–6 |

---

## Swap

By default kubelet **refuses** to start with swap enabled (or requires explicit configuration — not for prod).

```bash
swapon --show
sudo swapoff -a
sudo sed -i '/ swap / s/^\([^#]\)/#\1/' /etc/fstab
```

**Why:** memory cgroup predictability; otherwise memory "leaks" into swap and OOM behavior becomes opaque.

---

## Kernel modules

```bash
sudo modprobe overlay
sudo modprobe br_netfilter
lsmod | grep -E 'overlay|br_netfilter'
```

Persist:

```bash
echo -e 'overlay\nbr_netfilter' | sudo tee /etc/modules-load.d/k8s.conf
```

---

## sysctl

```bash
cat <<'EOF' | sudo tee /etc/sysctl.d/99-kubernetes.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
sudo sysctl --system
```

| Parameter | Why |
|----------|--------|
| bridge-nf-call-iptables | iptables sees bridge traffic (many CNIs) |
| ip_forward | routing pod ↔ service ↔ the outside world |

Check:

```bash
sysctl net.bridge.bridge-nf-call-iptables net.ipv4.ip_forward
```

---

## Ports (reference)

| Role | Ports |
|------|--------|
| control plane | 6443 API, 2379-2380 etcd, 10250 kubelet, … |
| worker | **10250** kubelet, NodePort 30000-32767, CNI (VXLAN 4789, BGP 179…) |

**ufw** on the node: allow from the **master** and the **pod CIDR** — otherwise NotReady.

---

## containerd for kubelet

```bash
sudo apt install -y containerd
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
# SystemdCgroup = true — for the systemd cgroup driver (check the docs for your k8s version)
sudo systemctl enable --now containerd
```

kubelet `cgroupDriver: systemd` must match the runtime.

---

## verify-node.sh

In the repository:

```bash
bash courses/linux-advanced/examples/verify-node.sh
```

Extend the script to your standard (swap, modules, sysctl, chrony, containerd active).

---

## Related

- [`INSTALL.md`](../../INSTALL.md)
- [`mockctl up`](../../mockctl/README.md)
- [linux-intermediate: firewall](../linux-intermediate/07-firewall.md)

---

## Common mistakes

| Symptom | Cause |
|---------|---------|
| NotReady | CNI, swap, kubelet |
| pod network doesn't work | bridge-nf, fw |
| ImagePullBackOff | registry, not swap |
| join OK, no routes | ip_forward |

---

## In production

Managed EKS/GKE/AKS partly hide the join, but the **AMI/image** must meet the requirements. For bare metal — an Ansible role "k8s node prep" + verify before join.

---

## Summary

A worker node = ordinary Linux + **swap off** + **modules** + **sysctl** + **CRI** + networking/firewall. Run [verify-node.sh](examples/verify-node.sh) before kubeadm.

## Checklist

- [ ] Why disable swap?
- [ ] What does bridge-nf-call-iptables do?
- [ ] Where do you persist sysctl?
- [ ] Which CRI socket does containerd use?

Next lesson: [08. Lab: verify-node](08-lab-node-prep.md).
