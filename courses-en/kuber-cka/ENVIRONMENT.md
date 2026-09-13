# Environment for Kubernetes CKA Lab

Three **Linux nodes** that Ansible can SSH into, then **Kubespray** installs Kubernetes. This is **not** Docker Desktop Kubernetes.

The default stand is **one 16 GB Ubuntu host + three LXC nodes** (same idea as [`kuber-bootstrap` Path B](../kuber-bootstrap/ENVIRONMENT.md)). Vagrant + VirtualBox also works if the laptop has ~10 GB free RAM.

Open lessons: **http://127.0.0.1:8091/kuber-cka/README.md**

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
| `kubectl` | talks to the cluster after install |
| Python 3 + PyYAML | [`labctl`](../../labctl/README.md) |
| Git, make, pip, tar, unzip | Kubespray install |
| RAM | **16 GB** on the LXC host |

Windows: run Ansible, Kubespray, `kubectl`, and `labctl` **inside WSL2 Ubuntu** (or SSH to the 16 GB box and work there). Read the course in the browser on Windows.

Turn **off** Docker Desktop Kubernetes while this stand is up — RAM.

---

## One-time: LXC nodes

On the 16 GB Ubuntu host:

```bash
sudo apt update
sudo apt install -y ansible git python3-pip python3-venv curl make tar unzip
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

Creating the three containers and SSH is **[Bootstrap 01](11-lab-nodes.md)**. Reference commands also live in [`examples/lxc-setup.sh`](examples/lxc-setup.sh).

---

## Work directory

Student files live **outside** `courses-en`:

```bash
mkdir -p ~/kuber-cka
export KUBER_CKA_DIR=$HOME/kuber-cka
```

[`examples/`](examples/README.md) is an author reference. You type inventory and clone Kubespray yourself.

---

## kubeconfig

After Kubespray finishes, copy admin kubeconfig. Do **not** overwrite a Docker Desktop config:

```bash
mkdir -p ~/.kube
# typical Kubespray artifact:
cp ~/kuber-cka/kubespray/inventory/lab/artifacts/admin.conf ~/.kube/kuber-cka.conf
export KUBECONFIG=$HOME/.kube/kuber-cka.conf
kubectl get nodes
```

`labctl` uses `KUBECONFIG` if set, otherwise `~/.kube/kuber-cka.conf`. It **refuses** context `docker-desktop`.

---

## labctl + courses UI

On the same machine as `kubectl`:

```bash
cd /path/to/mock-exams
pip install -r labctl/requirements.txt
export KUBECONFIG=$HOME/.kube/kuber-cka.conf
export LABCTL_MODE=training
python -m labctl status
```

Then `mockctl web` (or the QUICKSTART container) for reading. **Start / Check / Cleanup** on a `kuber-cka` lab call `labctl`. Export `KUBECONFIG` **before** you start `mockctl web`.

SSH for node-breaking labs:

| Variable | Meaning |
|----------|---------|
| `CKA_SSH_USER` | default `ubuntu` |
| `CKA_SSH_KEY` | private key if not the default |
| `KUBER_CKA_DIR` | inventory root (`~/kuber-cka`) |

`labctl` tries Ansible against that inventory, then `lxc exec`, then SSH.

---

## Versions (pin these unless a lab says otherwise)

| Piece | Version |
|-------|---------|
| Kubespray | `v2.27.0` |
| Kubernetes | `v1.31.x` (upgrade lab moves you one supported minor) |
| containerd | whatever Kubespray installs |
| CNI | Calico |
| DNS | CoreDNS |

Ingress controller is **your** choice (Kubespray `ingress_nginx_enabled` or a Helm chart). The verifier checks that an Ingress works, not how you installed the controller.

Images used in labs: `nginx:1.27`, `busybox:1.36`, `redis:7-alpine`, `curlimages/curl:8.10.1`.

---

## Sanity checklist (after bootstrap 09)

- [ ] `kubectl get nodes` — three **Ready**
- [ ] CoreDNS Ready in `kube-system`
- [ ] Calico (or your CNI) DaemonSet Ready
- [ ] Namespace `shop` — frontend, backend, redis Running
- [ ] Ingress `shop` routes `app.example.com` to frontend
- [ ] `python -m labctl start --lab bootstrap-09-ingress` then **Check** passes

---

## Related

| Course | When |
|--------|------|
| [`kuber-bootstrap`](../kuber-bootstrap/ENVIRONMENT.md) | Same LXC recipe, kubeadm instead of Kubespray |
| [`mock-cka-kubeadm`](../mock-cka-kubeadm/ENVIRONMENT.md) | Timed pack on a kubeadm cluster |
| [`labctl`](../../labctl/README.md) | Engine CLI |
