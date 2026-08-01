# 18. Hooks for Ansible (inventory)

## Intro: one srv1 by hand, a hundred servers with Ansible

You can do it on srv1: user, nginx, ufw. **Ansible** applies the same steps to **N hosts** from an inventory — idempotently, with a report, from GitLab CI.

A full Ansible course is separate; here — an **inventory** for the `deploy/linux` stand and the first **ad-hoc** commands.

## What you'll learn

- The **INI inventory** format.
- The **web**, **app** groups, **all:vars** variables.
- **ad-hoc**: ping, shell, apt.
- Modules vs **shell** — why it matters.

---

## Inventory INI

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
|---------|--------|
| `[web]` | a host group |
| `ansible_host` | IP for SSH |
| `[lab:children]` | a union of groups |
| `all:vars` | shared variables |

---

## Checking access

```bash
ansible all -i inventory/lab.ini -m ping
```

**Success:** `pong` on each host.

**If unreachable:** key, firewall, `ansible_host`, user.

---

## ad-hoc examples

```bash
ansible app -i inventory/lab.ini -m shell -a 'hostname -f'
ansible web -i inventory/lab.ini -m apt -a 'name=nginx state=present' -b
ansible srv1 -i inventory/lab.ini -m copy -a 'src=./file dest=/tmp/file mode=0644'
ansible app -i inventory/lab.ini -m systemd -a 'name=nginx state=started enabled=yes' -b
```

| Module | Why |
|--------|--------|
| `ping` | connectivity + Python |
| `command`/`shell` | one-off, without idempotency |
| `apt`, `copy`, `template`, `systemd` | **preferred** in playbooks |

---

## Playbook (preview)

```yaml
# site.yml
- hosts: app
  become: true
  tasks:
    - name: Ensure nginx
      apt:
        name: nginx
        state: present
    - name: Start nginx
      systemd:
        name: nginx
        state: started
```

```bash
ansible-playbook -i inventory/lab.ini site.yml
```

---

## Link to the hardening capstone

The roles can be extracted: `hardening`, `auditd`, `fail2ban` — one playbook for **srv1** instead of manual labs (optional for independent practice).

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| shell instead of apt | not idempotent |
| secrets in the git inventory | leak |
| no `-b` for root tasks | permission denied |
| host key checking in CI | fail without a `known_hosts` policy |

---

## In production

Inventory from **dynamic** sources (AWS, GCP), Vault for secrets, AWX/Controller, lint (ansible-lint), CI `ansible-playbook --check`.

---

## Summary

**Inventory** — a list of hosts and variables. **ad-hoc** — quick checks. **Playbooks + modules** — the production path.

## Checklist

- [ ] What is an inventory?
- [ ] How do you check all hosts with one command?
- [ ] Why is apt better than shell?

Next lesson: [19. sysctl and limits](19-sysctl-limits.md).
