# 03. Lab: ping the fleet

## Goal

Bring up the Linux lab, install Ansible on **`lab`**, create inventory + SSH keys, and get **`pong`** from **web**, **srv1**, and **srv2**.

## Prerequisites

- [ENVIRONMENT.md](ENVIRONMENT.md) — Docker, `deploy/linux` running  
- You can `docker compose exec lab bash`

## Task 1. Start the stand

On the host:

```bash
cd deploy/linux
docker compose up -d
docker compose exec lab ping -c1 172.28.0.11
```

## Task 2. Install Ansible on `lab`

```bash
docker compose exec lab bash
sudo apt-get update
sudo apt-get install -y ansible sshpass
ansible --version
```

## Task 3. SSH keys to all targets

On `lab`:

```bash
mkdir -p ~/ansible-lab/inventory
cd ~/ansible-lab
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_lab
for h in 172.28.0.11 172.28.0.12 172.28.0.20; do
  sshpass -p course ssh-copy-id -o StrictHostKeyChecking=no -i ~/.ssh/id_lab course@$h
done
```

Manual check:

```bash
ssh -i ~/.ssh/id_lab course@172.28.0.20 hostname   # web
```

## Task 4. Write inventory

Create `~/ansible-lab/inventory/lab.ini` (copy from [02-inventory-adhoc.md](02-inventory-adhoc.md) or [examples/inventory/lab.ini](examples/inventory/lab.ini)).

Optional `ansible.cfg` from [examples/ansible.cfg](examples/ansible.cfg).

## Task 5. Ping

```bash
cd ~/ansible-lab
ansible all -m ping
ansible lab -m ping          # both groups via :children
ansible app -m command -a 'hostname'
ansible web -m setup -a 'filter=ansible_distribution'
```

## Success criteria

- [ ] `ansible all -m ping` → `pong` on **three** hosts (web, srv1, srv2)  
- [ ] `ansible app --list-hosts` shows srv1 and srv2  
- [ ] `ansible web -m setup` returns `ansible_distribution": "Ubuntu"`  

## If it fails

| Symptom | Try |
|---------|-----|
| `UNREACHABLE` on one host | `docker compose restart srv1`; `systemctl status ssh` inside that container |
| `Permission denied` | Re-run `ssh-copy-id` for that IP |
| `command not found: ansible` | Install on **`lab`**, not on Windows host |
| Ping works from host but not lab | You must run Ansible **inside** `lab` |

Next: [04. Playbooks, modules, idempotency](04-playbooks.md).
