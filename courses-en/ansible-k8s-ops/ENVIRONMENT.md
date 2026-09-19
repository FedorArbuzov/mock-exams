# Environment for Ansible Kubernetes ops

Three **Linux nodes** that Ansible can SSH into. **Kubespray** installs Kubernetes. **Your** playbooks in `~/nimbus-ops` do everything after that.

This is **not** Docker Desktop Kubernetes and **not** the [`deploy/linux`](../../deploy/linux/README.md) Ansible lab.

The stand is **one 16 GB Ubuntu host + three LXC nodes you create in [lesson 02](02-lab-nodes.md)**. Vagrant + VirtualBox also works if the laptop has ~10 GB free RAM; keep the IPs below. Do **not** reuse nodes or a kubeconfig from another course.

Open lessons: **http://127.0.0.1:8091/ansible-k8s-ops/README.md**

```text
node-01   192.168.56.10   control-plane + etcd
node-02   192.168.56.11   worker
node-03   192.168.56.12   worker
```

Do **not** publish `6443` on a public interface. The advertise address stays on `192.168.56.10`.

---

## What you need

| Tool | Where |
|------|--------|
| LXD / Incus (or Vagrant + VirtualBox) | host that runs the nodes |
| Ansible ≥ 2.15 | same host (or WSL if the VMs are on Windows VirtualBox) |
| `ansible.posix` | `ansible-galaxy collection install ansible.posix` (authorized_key) |
| `kubectl` | after Kubespray |
| Git, make, pip, tar, unzip | Kubespray install |
| RAM | **16 GB** on the LXC host |

Windows: run Ansible, Kubespray, and `kubectl` **inside WSL2 Ubuntu** (or SSH to the 16 GB box and work there). Read the course in the browser on Windows.

Turn **off** Docker Desktop Kubernetes while this stand is up — RAM.

---

## One-time: LXC nodes

On the 16 GB Ubuntu host:

```bash
sudo apt update
sudo apt install -y ansible git python3-pip python3-venv curl make tar unzip
ansible-galaxy collection install ansible.posix
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
# log out and back in (or newgrp lxd)
```

Ubuntu 24.04 may use Incus (`sudo apt install incus`): type `incus` wherever this page says `lxc`.

```bash
lxc network create k8sbr0 ipv4.address=192.168.56.1/24 ipv4.nat=true ipv6.address=none

lxc profile create k8s
lxc profile device add k8s root disk path=/ pool=default
lxc profile device add k8s eth0 nic nictype=bridged parent=k8sbr0 name=eth0
lxc profile set k8s security.privileged=true
lxc profile set k8s security.nesting=true
lxc profile set k8s linux.kernel_modules=overlay,br_netfilter,ip_tables,ip6_tables,nf_nat
lxc profile set k8s raw.lxc="lxc.apparmor.profile=unconfined
lxc.cgroup2.devices.allow=a
lxc.mount.auto=proc:rw sys:rw
lxc.cap.drop="
```

Privileged + nesting is for **this lab** so Calico and kube-proxy can use iptables and overlay. Do not copy this profile onto a multi-tenant host.

Creating the three containers and SSH is **[lesson 02](02-lab-nodes.md)**. Reference commands also live in [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directories

Student files live **outside** `courses-en`:

```bash
mkdir -p ~/nimbus-ops
# Kubespray is a sibling checkout, not a role inside nimbus-ops:
# ~/kubespray   (git clone -b v2.27.0)
```

Clone Kubespray in [lesson 04](04-lab-cluster.md). [`examples/`](examples/README.md) is an author reference. You type inventory and playbooks.

---

## kubeconfig

After Kubespray finishes, copy admin kubeconfig. Do **not** overwrite a Docker Desktop config:

```bash
mkdir -p ~/.kube
# typical Kubespray artifact:
cp ~/kubespray/inventory/lab/artifacts/admin.conf ~/.kube/nimbus-ops.conf
export KUBECONFIG=$HOME/.kube/nimbus-ops.conf
kubectl get nodes
```

Refuse context `docker-desktop`. If `kubectl` talks to `127.0.0.1` you are on the wrong cluster.

---

## Versions (pin these unless a lab says otherwise)

| Piece | Version |
|-------|---------|
| Kubespray | `v2.27.0` |
| Kubernetes | `v1.31.x` |
| containerd | whatever Kubespray installs |
| CNI | Calico |
| DNS | CoreDNS |

No Helm in this course. No shop app. No fourth node.

---

## Sanity checklist (after lesson 04)

- [ ] `ansible -i ~/nimbus-ops/inventory/hosts.yml all -m ping` — three `pong`
- [ ] `kubectl get nodes` — three **Ready** (`KUBECONFIG` = `nimbus-ops.conf`)
- [ ] CoreDNS Ready in `kube-system`
- [ ] Calico DaemonSet Ready
- [ ] You can say what lives in `/etc/kubernetes` on `node-01` without opening a Kubespray role

---

## Related

| Course | When |
|--------|------|
| [`kuber-bootstrap` ENVIRONMENT](../kuber-bootstrap/ENVIRONMENT.md) | Other track: kubeadm, not this cluster |
| [`kuber-cka` ENVIRONMENT](../kuber-cka/ENVIRONMENT.md) | Other track: CKA labs, not this cluster |
