# Environment for Kubernetes Bootstrap

Three **Ubuntu VMs** via **Vagrant + VirtualBox**. Ansible from your **Linux/macOS host** or **WSL2**. This is **not** Docker Desktop Kubernetes and **not** [`deploy/linux`](../../deploy/linux/README.md).

Open lessons: **http://127.0.0.1:8091/kuber-bootstrap/README.md** (courses UI is optional).

## What you need

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

## Working directory

You **write** the stand in [02-lab-vms.md](02-lab-vms.md): `~/kuber-bootstrap` with `Vagrantfile`, `ansible.cfg`, `inventory/lab.ini`. Do not copy anything from `courses-en`.

Windows: Vagrant in **PowerShell**, Ansible in **WSL2**, same folder (`/mnt/c/Users/YOU/kuber-bootstrap`). First `vagrant up` downloads the Ubuntu box.

## Fixed names

| Inventory | IP | RAM in Vagrantfile |
|-----------|-----|---------------------|
| `cp` | 192.168.56.10 | 2048 MB |
| `w1` | 192.168.56.11 | 1536 MB |
| `w2` | 192.168.56.12 | 1536 MB |
| SSH user | `vagrant` | keys under `.vagrant/machines/<name>/virtualbox/private_key` |
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

- [ ] `vagrant status` — three VMs running
- [ ] `ansible -i inventory/lab.ini all -m ping` — pong
- [ ] `free -h` on the host — you are not swapping to death
- [ ] Docker Desktop k8s is off (or you accepted the RAM fight)

## Destroy (end of a session)

```bash
cd ~/kuber-bootstrap
vagrant halt          # keep disks
# vagrant destroy -f  # finale / start over
```

`destroy` is required for lesson 15 (from-scratch apply).

## Related

- [ansible-basic/ENVIRONMENT.md](../ansible-basic/ENVIRONMENT.md) — different stand (`deploy/linux`). Do not point this inventory at `srv1`.
- [kuber-basic/ENVIRONMENT.md](../kuber-basic/ENVIRONMENT.md) — Docker Desktop; leave it alone for this course.
