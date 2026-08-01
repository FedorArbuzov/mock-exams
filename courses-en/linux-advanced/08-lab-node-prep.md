# 08. Lab: node checklist

## Lab goal

Run **verify-node.sh** and manually apply **sysctl/modules** on lab — as a rehearsal for preparing a worker before `kubeadm join` or mockctl.

## Prerequisites

- [07. K8s node prep](07-k8s-node-prep.md).
- Stand Up.

```bash
docker compose exec lab bash
```

---

## Preparing the stand

```bash
hostname
swapon --show || echo "no swap"
```

---

## Task 1. verify-node.sh

From the repository root (on lab, if the repo is mounted) or copy the logic manually:

```bash
# if the repo is available:
bash /path/to/courses/linux-advanced/examples/verify-node.sh

# manually on lab:
echo "== swap =="
swapon --show || echo "swap off OK"
echo "== forward =="
sysctl net.ipv4.ip_forward
echo "== ssh =="
systemctl is-active ssh
```

**What you'll see:** `swap off OK`, `ip_forward` 0 or 1, `ssh active`.

---

## Task 2. Modules (if possible in the container)

```bash
sudo modprobe br_netfilter 2>/dev/null && echo OK || echo "modprobe may fail in container — OK for lab"
sudo modprobe overlay 2>/dev/null
lsmod | grep -E 'br_netfilter|overlay' || true
```

In a Docker container modules may be unavailable — on a **real VM** this is a mandatory step.

---

## Task 3. sysctl as on a K8s node

```bash
cat <<'EOF' | sudo tee /etc/sysctl.d/99-kubernetes-lab.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF
sudo sysctl -p /etc/sysctl.d/99-kubernetes-lab.conf 2>/dev/null || sudo sysctl --system
sysctl net.ipv4.ip_forward
```

**If bridge-nf is missing:** the br_netfilter module isn't loaded — on bare metal fix this before the join.

---

## Task 4. swapoff (for practice)

```bash
swapon --show
sudo swapoff -a 2>/dev/null || echo "no swap to disable"
swapon --show || echo "swap off OK"
```

---

## Task 5. Comparison with mockctl (optional)

On a host with a cluster:

```bash
kubectl get nodes -o wide
kubectl describe node | grep -A5 Conditions
```

**What you'll see:** Ready=True for a healthy node.

---

## Task 6. Checklist to a file

```bash
tee /tmp/node-prep-checklist.txt <<'EOF'
[ ] swap off
[ ] br_netfilter loaded (on real VM)
[ ] ip_forward=1
[ ] bridge-nf-call-iptables=1
[ ] containerd/CRI running (on real node)
[ ] verify-node.sh OK
EOF
cat /tmp/node-prep-checklist.txt
```

---

## Success criteria

- [ ] verify-node.sh (or the manual equivalent) without critical surprises
- [ ] `net.ipv4.ip_forward = 1` after sysctl
- [ ] The checklist `/tmp/node-prep-checklist.txt` was created
- [ ] You understand that some steps are a simulation in the container

## What to take to work

- Before join — use a **script**, not memory.
- NotReady — first check the kubelet journal, swap, CNI, sysctl.
- Document how your AMI differs from upstream kubeadm.

Next lesson: [09. auditd](09-auditd.md).
