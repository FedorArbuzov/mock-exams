# Environment for Ansible Basics

This course uses the **Docker Linux lab** ([`deploy/linux`](../../deploy/linux/README.md)) — **not** Docker Desktop Kubernetes. You run Ansible **inside** the `lab` container so it can reach **172.28.0.0/24**.

The **courses UI** ([QUICKSTART.md](../../QUICKSTART.md)) is optional for reading lessons in the browser; labs happen on the Linux stand.

## One-time setup

### A. Start the Linux lab

From the repository root (or clone path):

```bash
cd deploy/linux
docker compose build
docker compose up -d
```

Wait ~30–60 s, then:

```bash
docker compose ps
docker compose exec lab ping -c1 172.28.0.11
```

| Host | IP | SSH user / password |
|------|-----|---------------------|
| lab (control) | 172.28.0.10 | course / course |
| srv1 | 172.28.0.11 | course / course |
| srv2 | 172.28.0.12 | course / course |
| web | 172.28.0.20 | course / course |

Enter the control node:

```bash
docker compose exec lab bash
# you are course@lab
```

### B. Install Ansible on `lab`

Inside the `lab` container (Ubuntu 24.04):

```bash
sudo apt-get update
sudo apt-get install -y ansible sshpass
ansible --version
```

### C. Workspace and SSH trust

Still on `lab`:

```bash
mkdir -p ~/ansible-lab/inventory ~/ansible-lab/roles
cd ~/ansible-lab

# passwordless SSH to targets (lab-only passwords)
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_lab
for h in 172.28.0.11 172.28.0.12 172.28.0.20; do
  sshpass -p course ssh-copy-id -o StrictHostKeyChecking=no -i ~/.ssh/id_lab course@$h
done
ssh -i ~/.ssh/id_lab course@172.28.0.11 hostname   # should print srv1
```

Copy starter files from the course (if you have the repo mounted) or create inventory from lesson 02:

```ini
# inventory/lab.ini
[web]
web ansible_host=172.28.0.20

[app]
srv1 ansible_host=172.28.0.11
srv2 ansible_host=172.28.0.12

[lab:children]
web
app

[all:vars]
ansible_user=course
ansible_ssh_private_key_file=~/.ssh/id_lab
ansible_python_interpreter=/usr/bin/python3
```

Sanity:

```bash
ansible all -i inventory/lab.ini -m ping
```

### D. Courses UI (optional)

Follow [QUICKSTART.md](../../QUICKSTART.md) to open **http://127.0.0.1:8091/** and navigate to **ansible-basic**.

## Working directory

Keep everything under **`~/ansible-lab`** on the `lab` container. Suggested layout (built across lessons):

```text
ansible-lab/
  ansible.cfg
  inventory/lab.ini
  group_vars/
  host_vars/
  site.yml
  roles/
  scripts/
```

Example snippets: [examples/](examples/README.md).

## How labs are checked

| Lesson | Check |
|--------|--------|
| Most labs | Success criteria checklist in the lesson |
| Final project | [scripts/verify-final.sh](scripts/verify-final.sh) run **on `lab`** |

There is **no** Kubernetes / LocalStack Interactive Check — Ansible targets are on the private `mock-linux` Docker network.

## Reset the stand

```bash
cd deploy/linux
docker compose down -v
docker compose build
docker compose up -d
```

Re-run sections B–C on `lab` (new SSH keys, empty targets).

## Troubleshooting

| Symptom | Try |
|---------|-----|
| `UNREACHABLE` | `docker compose ps`; `docker compose exec srv1 systemctl status ssh`; ping from `lab` |
| `Permission denied (publickey)` | Re-run `ssh-copy-id`; check `ansible_ssh_private_key_file` |
| `sudo: a password is required` | Use `become: true` and `become_method: sudo` (NOPASSWD for `course` on stand) |
| `Failed to connect to the host via ssh` | Wrong `ansible_host` IP |
| Slow first `docker compose build` | Image is large; cached on next runs |

## Uninstall

```bash
cd deploy/linux && docker compose down -v
```

Stop the courses UI container if you started it: `docker rm -f mockctl-web`.
