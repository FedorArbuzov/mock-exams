# 02. Lab: nodes and an empty ops repo

Do **not** install Kubernetes yet. You do **not** copy `courses-en` onto the host.

## Ticket

P3 — onboarding

Create three empty LXC nodes. Get SSH, an inventory, and a README that says who owns what. Kubernetes is still not installed.

## Task 1. Three containers

On the 16 GB host, after [ENVIRONMENT.md](ENVIRONMENT.md) profile `k8s` exists:

```text
node-01   192.168.56.10
node-02   192.168.56.11
node-03   192.168.56.12
```

Each node: Ubuntu 22.04, SSH as `ubuntu` with your key, `sudo` without a password.

Reference commands: [`examples/lxc-setup.sh`](examples/lxc-setup.sh). Type them. Launch **this** course’s nodes — do not attach a leftover `node-01` from another lab.

```bash
ansible all -i inventory/hosts.yml -m ping
```

must wait until Task 3.

## Task 2. Repo skeleton

```bash
mkdir -p ~/nimbus-ops/{inventory,group_vars/all,host_vars,roles,playbooks/runbooks,backups,artifacts}
cd ~/nimbus-ops
```

`ansible.cfg`: inventory path, `host_key_checking = False` for the lab, `become_method = sudo`. Picture: [`examples/ansible.cfg`](examples/ansible.cfg).

```bash
ansible-galaxy collection install ansible.posix
```

## Task 3. Inventory

`inventory/hosts.yml` — YAML inventory, groups:

```text
k8s_cp        node-01
k8s_workers   node-02, node-03
k8s           k8s_cp + k8s_workers
```

`all:vars`: `ansible_user=ubuntu`, key `~/.ssh/id_ed25519`, `ansible_python_interpreter=/usr/bin/python3`.

```bash
cd ~/nimbus-ops
ansible all -m ping
ansible k8s_workers --list-hosts
```

Three `pong`. Workers list is two names.

## Task 4. README

`~/nimbus-ops/README.md` — five lines is enough:

- Kubespray lives in `~/kubespray` (not cloned yet)
- this repo does baseline, people, patch, backup, runbooks
- kubeconfig: `~/.kube/nimbus-ops.conf`
- you do not edit Kubespray roles

## Success criteria

- [ ] `lxc list` (or Vagrant) shows three RUNNING nodes on `.10–.12`
- [ ] `ansible all -m ping` → three `pong`
- [ ] `ansible k8s_cp --list-hosts` → only `node-01`
- [ ] README states the two-tree rule

Next: [03. Kubespray](03-kubespray.md).
