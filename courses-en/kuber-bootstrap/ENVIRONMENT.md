# Environment for Kubernetes Bootstrap

Three **Linux nodes** (`cp`, `w1`, `w2`) that Ansible can SSH into. This is **not** Docker Desktop Kubernetes and **not** [`deploy/linux`](../../deploy/linux/README.md).

Pick **one** path:

| Path | When |
|------|------|
| **A — Vagrant + VirtualBox** | Laptop with ~10 GB free RAM |
| **B — one 16 GB Linux VM + LXD** | Windows laptop is tight; you already rent Ubuntu (Hetzner, Timeweb, …) |

Same IPs, same later labs. Path B skips VirtualBox: you work **inside** the rented VM (SSH from the laptop, read the course in the browser).

Open lessons: **http://127.0.0.1:8091/kuber-bootstrap/README.md** or [GitHub Pages](https://fedorarbuzov.github.io/mock-exams/kuber-bootstrap/).

## Path A — Vagrant (default)

| Tool | Why |
|------|-----|
| [VirtualBox](https://www.virtualbox.org/) 7.x | hypervisor |
| [Vagrant](https://developer.hashicorp.com/vagrant/install) ≥ 2.4 | you write the `Vagrantfile` in [lesson 02](02-lab-vms.md) |
| Ansible ≥ 2.15 | control node (apt / pip / brew) |
| `kubectl` | talk to the cluster after init |
| RAM | **8 GB** minimum for the three VMs; **10 GB** better |

Turn **off** Docker Desktop Kubernetes (and heavy compose stacks) while the VMs run.

### Windows

1. Install VirtualBox + Vagrant **on Windows**.
2. Install Ansible + kubectl **inside WSL2 Ubuntu** (Windows Ansible is not a course path).
3. VMs get `192.168.56.10–12`. From WSL2, ping them. If they are unreachable, enable WSL **mirrored** networking (Windows 11) or run Ansible **on `cp`** after `vagrant ssh cp` (install Ansible there, inventory still those IPs on `eth1`).

Hyper-V and VirtualBox fight. If Vagrant cannot start: disable Hyper-V **or** use the Hyper-V Vagrant provider (not documented here — VirtualBox is the default).

### macOS / Linux

VirtualBox (or Vagrant libvirt on Linux if you already use it — then change the provider in the Vagrantfile). Ansible and kubectl on the same machine you run `vagrant` from.

## Path B — 16 GB Ubuntu + three LXD nodes

You SSH into **one** Ubuntu box (≥16 GB RAM). On that box you create three containers that look like VMs to kubeadm. Nested VirtualBox inside a cheap VPS usually **fails** — do not go that way.

Do **not** publish `6443` on the public interface. Advertise address stays `192.168.56.10` (the LXD bridge).

### B1. Packages on the rented VM

```bash
sudo apt update
sudo apt install -y ansible curl
# kubectl later (lesson 06) — or: snap install kubectl --classic
```

LXD (works on Ubuntu 22.04/24.04). After install, **log out and back in** so the `lxd` group applies:

```bash
sudo snap install lxd
sudo lxd init --auto
sudo usermod -aG lxd "$USER"
```

On Ubuntu 24.04 you may use `sudo apt install incus` instead: type `incus` everywhere this page says `lxc`.

### B2. Bridge + k8s profile

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

Privileged + nesting is for **this lab** so kubeadm/Flannel can use iptables and overlay. Do not copy this profile onto a multi-tenant prod host.

### B3. Three nodes, fixed IPs

```bash
lxc launch ubuntu:22.04 cp --profile k8s
lxc launch ubuntu:22.04 w1 --profile k8s
lxc launch ubuntu:22.04 w2 --profile k8s

lxc config device set cp eth0 ipv4.address=192.168.56.10
lxc config device set w1 eth0 ipv4.address=192.168.56.11
lxc config device set w2 eth0 ipv4.address=192.168.56.12
lxc restart cp w1 w2
```

Optional RAM caps (host keeps a few GB for itself):

```bash
lxc config set cp limits.memory=2GiB
lxc config set w1 limits.memory=1536MiB
lxc config set w2 limits.memory=1536MiB
```

### B4. SSH as `ubuntu` (Ansible)

On the **rented VM** (not inside a container):

```bash
test -f ~/.ssh/id_ed25519 || ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
```

For each of `cp` `w1` `w2`:

```bash
lxc exec cp -- apt-get update
lxc exec cp -- apt-get install -y openssh-server sudo
lxc exec cp -- mkdir -p /home/ubuntu/.ssh
lxc file push ~/.ssh/id_ed25519.pub cp/home/ubuntu/.ssh/authorized_keys
lxc exec cp -- chown -R ubuntu:ubuntu /home/ubuntu/.ssh
lxc exec cp -- chmod 700 /home/ubuntu/.ssh
lxc exec cp -- chmod 600 /home/ubuntu/.ssh/authorized_keys
lxc exec cp -- bash -c 'echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu'
```

Repeat replacing `cp` with `w1`, then `w2`. Smoke:

```bash
ssh -o StrictHostKeyChecking=no ubuntu@192.168.56.10 hostname
```

### B5. Inventory (no Vagrantfile)

```bash
mkdir -p ~/kuber-bootstrap/inventory
```

`~/kuber-bootstrap/ansible.cfg` — same as [lesson 02](02-lab-vms.md) Task 2.

`~/kuber-bootstrap/inventory/lab.ini`:

```ini
[k8s_cp]
cp ansible_host=192.168.56.10

[k8s_workers]
w1 ansible_host=192.168.56.11
w2 ansible_host=192.168.56.12

[k8s:children]
k8s_cp
k8s_workers

[all:vars]
ansible_user=ubuntu
ansible_ssh_private_key_file=~/.ssh/id_ed25519
ansible_ssh_common_args=-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null
```

Then [02](02-lab-vms.md) **Task 4** (`ansible all -m ping`). Skip the Vagrantfile and `vagrant up`.

Later labs: `vagrant ssh cp -- '…'` becomes `ssh ubuntu@192.168.56.10 '…'` or `lxc exec cp -- …`.

### B6. kubeconfig after lesson 06

```bash
mkdir -p ~/.kube
ssh ubuntu@192.168.56.10 'sudo cat /etc/kubernetes/admin.conf' > ~/.kube/kuber-bootstrap.conf
# server must be https://192.168.56.10:6443
export KUBECONFIG=$HOME/.kube/kuber-bootstrap.conf
kubectl get nodes
```

Run `kubectl` **on the rented VM** (it can reach `192.168.56.10`). Do not open 6443 on the public NIC.

### B7. Tear down

```bash
lxc stop cp w1 w2
lxc delete cp w1 w2
# finale (lesson 15): delete + launch again from B3, keep the profile
```

When the weekend ends, **delete or stop the rented VM** so it does not keep billing.

## Working directory

You **write** `~/kuber-bootstrap` yourself. Do not copy `courses-en`.

- Path A: `Vagrantfile` + `ansible.cfg` + `inventory/lab.ini` in [02](02-lab-vms.md). Windows: Vagrant in PowerShell, Ansible in WSL2, same folder.
- Path B: no `Vagrantfile`. Inventory from **B5**. Work on the rented VM.

## Fixed names

| Inventory | IP | RAM in Vagrantfile |
|-----------|-----|---------------------|
| `cp` | 192.168.56.10 | 2048 MB |
| `w1` | 192.168.56.11 | 1536 MB |
| `w2` | 192.168.56.12 | 1536 MB |
| SSH user | Path A: `vagrant` (Vagrant keys). Path B: `ubuntu` (`~/.ssh/id_ed25519`) |
| Pod CIDR | `10.244.0.0/16` | Flannel |
| k8s minor (labs 04–10) | **1.31** | upgrade lab → **1.32** |

If `apt` 404s on those minors, pick **two consecutive** versions from [pkgs.k8s.io](https://kubernetes.io/blog/2023/08/15/pkgs-k8s-io-introduction/) and keep the upgrade a single minor step.

## Ansible from the Vagrant directory

```bash
cd ~/kuber-bootstrap
ansible -i inventory/lab.ini all -m ping
```

`ansible.cfg` sets `inventory` and host-key checking. First ping may ask to trust SSH keys — `StrictHostKeyChecking=no` is set for the lab only.

## kubeconfig on the laptop

After lesson 06:

```bash
mkdir -p ~/.kube
vagrant ssh cp -c "sudo cat /etc/kubernetes/admin.conf" > ~/.kube/kuber-bootstrap.conf
# rewrite the server IP to the VM:
#   server: https://192.168.56.10:6443
export KUBECONFIG=$HOME/.kube/kuber-bootstrap.conf
kubectl get nodes
```

Do **not** overwrite your Docker Desktop `~/.kube/config` blindly. Use `KUBECONFIG` or a second file.

## Sanity checklist

- [ ] Path A: `vagrant status` — 3 × running. Path B: `lxc list` — `cp` `w1` `w2` RUNNING  
- [ ] `ansible -i inventory/lab.ini all -m ping` — pong  
- [ ] `free -h` on the machine that runs the nodes — not swapping to death  
- [ ] Path A: Docker Desktop k8s is off. Path B: `6443` is not open on the public IP  

## Destroy (end of a session)

Path A:

```bash
cd ~/kuber-bootstrap
vagrant halt
# vagrant destroy -f   # finale
```

Path B: see **B7**. Lesson 15 still means wipe the three nodes and rebuild from inventory + playbooks.

## Related

- [ansible-basic/ENVIRONMENT.md](../ansible-basic/ENVIRONMENT.md) — different stand (`deploy/linux`). Do not point this inventory at `srv1`.
- [kuber-basic/ENVIRONMENT.md](../kuber-basic/ENVIRONMENT.md) — Docker Desktop; leave it alone for this course.
