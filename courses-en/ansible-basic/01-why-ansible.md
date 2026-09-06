# 01. Why Ansible (not bash for loops)

## Intro: three servers, one typo

You fixed nginx on **srv1** manually. **srv2** still serves the old config. A colleague runs a `for host in …; do ssh …` loop, but half the hosts fail on `sudo` and nobody knows which step actually applied.

**Ansible** runs the same **declarative steps** on many hosts from an **inventory**, reports per-host success, and is **idempotent** — running twice should not keep “changing” a correct system.

## What you'll learn

- When Ansible fits (and when it does not).
- Control node vs managed nodes.
- Modules vs raw `shell`.
- How this course maps to the `deploy/linux` stand.

---

## Mental model

```text
  ┌─────────────┐     SSH      ┌──────┐  ┌──────┐  ┌─────┐
  │ lab (control)│ ──────────► │ srv1 │  │ srv2 │  │ web │
  │  ansible     │             └──────┘  └──────┘  └─────┘
  └─────────────┘
```

- **Control node** — where you run `ansible` / `ansible-playbook` (our **`lab`** container).
- **Managed nodes** — targets in the inventory (`srv1`, `srv2`, `web`).
- **Inventory** — list of hosts + variables (IPs, users, groups).
- **Playbook** — ordered tasks using **modules** (`apt`, `copy`, `template`, `systemd`, …).

Ansible does **not** require an agent on targets — only SSH and Python (already on Ubuntu images in the stand).

---

## Ansible vs alternatives

| Tool | Good for | Weak for |
|------|----------|----------|
| **Shell scripts** | one-off, local | idempotency, reporting at scale |
| **Ansible** | OS config, packages, files, services | creating VPCs / RDS (use Terraform) |
| **Terraform** | cloud resources, APIs | fine-grained package versions on 200 VMs alone |
| **cloud-init** | first boot only | ongoing drift correction |
| **Kubernetes** | container orchestration | traditional VM package management |

Common **combo**: Terraform provisions VMs → Ansible configures them → app deploy via CI.

---

## Idempotency in one sentence

A module task describes **desired state** (`state: present`, `enabled: true`), not “run this command every time.”

Bad (not idempotent):

```bash
ssh srv1 'apt install -y nginx && systemctl start nginx'
```

Better (Ansible):

```yaml
- name: Ensure nginx package
  apt:
    name: nginx
    state: present
- name: Ensure nginx running
  systemd:
    name: nginx
    state: started
    enabled: true
```

Second run → `ok` (no change) if already correct.

---

## This course's stand

| Host | Role in labs |
|------|----------------|
| `lab` | Ansible control node |
| `web` | edge / nginx vhost |
| `srv1`, `srv2` | app tier |

Setup: [ENVIRONMENT.md](ENVIRONMENT.md).

---

## Common mistakes

| Mistake | Consequence |
|---------|-------------|
| Running Ansible from Windows host against 172.28.x | Host is not on Docker lab network → `UNREACHABLE` |
| `shell` everywhere | Drift, no change reporting, fragile |
| Secrets in git plaintext | leak in PR / fork |
| No inventory groups | cannot target `app` vs `web` cleanly |

---

## In production

- Playbooks in **Git**, reviewed like code.
- **ansible-lint**, Molecule tests, CI `ansible-playbook --check`.
- Dynamic inventory (AWS, GCP), **Vault** for secrets, AWX / Ansible Automation Platform for RBAC and schedules.

---

## Summary

Ansible is **SSH-based configuration management** with **idempotent modules** and a clear **inventory**. You will practice on three Linux containers from **`lab`**.

## Checklist

- [ ] What is the control node in our stand?
- [ ] Why is `apt` + `systemd` better than a remote `shell` loop?
- [ ] Name one job Terraform does better than Ansible.

Next: [02. Inventory and ad-hoc commands](02-inventory-adhoc.md).
