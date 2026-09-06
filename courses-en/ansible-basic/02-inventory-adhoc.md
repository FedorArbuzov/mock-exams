# 02. Inventory and ad-hoc commands

## Intro: "run this on all app servers"

Before writing a playbook, you need a **list of hosts** and a way to **ping** them. Ansible's **inventory** is that list — usually INI or YAML — plus variables per host or group.

## What you'll learn

- INI inventory: groups, children, `ansible_host`.
- `all:vars` and why `ansible_user` matters.
- **ad-hoc** commands: `ping`, `command`, `shell`, `setup`.
- `-b` / `--become` for root tasks.

---

## INI inventory

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

| Element | Meaning |
|---------|---------|
| `[web]` | group name |
| `web` (left side) | inventory hostname (used in logs) |
| `ansible_host` | IP or DNS Ansible connects to |
| `[lab:children]` | meta-group combining `web` + `app` |
| `[all:vars]` | variables for every host |

Hostnames **`srv1`** in `[app]` are labels — connection uses `ansible_host`.

---

## ansible.cfg (recommended)

In `~/ansible-lab/ansible.cfg`:

```ini
[defaults]
inventory = inventory/lab.ini
host_key_checking = False
retry_files_enabled = False
stdout_callback = yaml
```

Then omit `-i inventory/lab.ini` on every command.

---

## ad-hoc: connectivity

```bash
ansible all -m ping
ansible web -m ping
ansible app -m ping
```

Success: `pong` per host.

---

## ad-hoc: one command

```bash
# read-only, no shell interpolation
ansible app -m command -a 'hostname -f'

# become root for package tasks
ansible web -m apt -a 'name=nginx state=present' -b

# gather facts (OS, IPs, memory, …)
ansible srv1 -m setup
ansible srv1 -m setup -a 'filter=ansible_distribution*'
```

| Module | Use |
|--------|-----|
| `ping` | SSH + Python check |
| `command` | fixed argv, no `|` redirects |
| `shell` | when you truly need shell features (last resort) |
| `setup` | fact gathering (OS, IPs, RAM — full lesson [06b](06b-facts.md)) |

---

## Limit and serial

```bash
ansible app -m command -a 'uptime' --limit srv1
ansible app -m command -a 'uptime' -f 1   # one host at a time
```

Useful for canary runs before a full rollout.

---

## Common mistakes

| Mistake | Consequence |
|---------|-------------|
| Wrong IP in `ansible_host` | `UNREACHABLE` |
| Forgot `-b` on `apt` | permission denied |
| `shell` with `rm -rf` | not idempotent, dangerous |
| Inventory hostname ≠ DNS name | confusion in logs only (if `ansible_host` is set) |

---

## In production

- **Dynamic inventory** plugins (e.g. `aws_ec2`) generate lists from cloud APIs.
- Never commit **production passwords**; use Vault or CI secrets.
- `ansible-inventory --graph` to debug group membership.

---

## Summary

The **inventory** defines *who* you manage. **ad-hoc** modules are for quick checks; **playbooks** are for repeatable change.

## Checklist

- [ ] What does `ansible_host` override?
- [ ] Which ad-hoc module gathers facts?
- [ ] When do you need `-b`?

Next lab: [03. Lab: ping the fleet](03-lab-inventory.md).
