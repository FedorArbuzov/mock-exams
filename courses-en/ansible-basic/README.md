# Ansible — Basics

Hands-on course: **configuration management** with Ansible — inventory, playbooks, roles, templates, Vault — on the **Docker Linux lab** (`deploy/linux`). **No Kubernetes required.**

**Time:** ~16–22 hours + **2–3 hours** final project.  
**Prerequisites:** basic Linux and SSH ([`linux-basic`](../linux-basic/README.md) or equivalent). Helpful: [`linux-intermediate`](../linux-intermediate/README.md) (systemd, nginx).

> This is **ansible-basic**, not all of Ansible. It covers SSH configuration management on the Linux lab through roles, Vault, loops, tags, and rolling updates. It does **not** cover collections, dynamic inventory, Molecule, or AWX. For IaC on AWS see [`aws-terraform`](../aws-terraform/README.md). Short preview: [linux-advanced / 18](../linux-advanced/18-ansible-hooks.md).

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/ansible-basic/README.md**

---

## How to take this course

1. **Read** the theory page.
2. **Do** the lab — from the **`lab`** container (`docker compose exec lab bash`), run `ansible` / `ansible-playbook` against **srv1**, **srv2**, **web**.
3. **Check** — follow each lesson's success criteria. The finale uses **[scripts/verify-final.sh](scripts/verify-final.sh)** on the lab host. There is no cluster Interactive Check for this track (SSH targets live on a private Docker network).

**Tip:** keep one terminal inside `lab` and the courses UI in the browser.

---

## Local stand

| Component | How | Note |
|-----------|-----|------|
| Courses UI | [QUICKSTART.md](../../QUICKSTART.md) | http://127.0.0.1:8091/ (optional but recommended) |
| Linux lab | `deploy/linux` docker compose | **4+ GB** RAM for Docker |
| Control node | container **`lab`** (172.28.0.10) | Ansible installed here |
| Targets | **srv1** .11, **srv2** .12, **web** .20 | user `course` / `course` |
| Workspace | `~/ansible-lab` on `lab` | inventory + playbooks |

---

## Curriculum

### Foundations (01–03)

1. [Why Ansible (not bash for loops)](01-why-ansible.md)
2. [Inventory and ad-hoc commands](02-inventory-adhoc.md)
3. [Lab: ping the fleet](03-lab-inventory.md)

### Playbooks (04–05)

4. [Playbooks, modules, idempotency](04-playbooks.md)
5. [Lab: nginx on `web`](05-lab-playbook.md)

### Variables and facts (06–07)

6. [Variables: why they exist and where they live](06-variables-facts.md) — `group_vars`, `host_vars`, precedence
6b. [Facts: what the machine actually is](06b-facts.md) — `setup`, IPs, OS, CPU/RAM
6c. [register, when, and Jinja in tasks](06c-register-when.md)
7. [Lab: group_vars, host_vars, and facts](07-lab-variables.md)

### Roles (08–09)

8. [Roles: stop copy-pasting playbooks](08-roles.md) — layout, `site.yml`, `galaxy init`
8b. [Role defaults, parameters, dependencies](08b-role-defaults.md)
9. [Lab: extract an nginx role](09-lab-roles.md)

### Templates and handlers (10–11)

10. [Templates: generate config from variables](10-templates-handlers.md) — `.j2`, loops, `$uri` vs `{{ }}`
10b. [Handlers: reload once when config changes](10b-handlers.md)
11. [Lab: vhost from a template](11-lab-templates.md)

### Secrets and troubleshooting (12–13)

12. [ansible-vault and secret hygiene](12-vault-secrets.md)
13. [Lab: fix a broken playbook](13-lab-troubleshooting.md)

### Playbook control (15–21)

15. [Loops: one task, many items](15-loops.md)
16. [Lab: packages and users in a loop](16-lab-loops.md)
17. [Tags: run part of a playbook](17-tags.md)
18. [block, rescue, always](18-blocks.md)
19. [Everyday modules](19-modules.md)
20. [Rolling updates: serial, limit, fail budget](20-rolling.md)
21. [Lab: baseline + rolling marker](21-lab-rollout.md)

### Capstone

22. [Final project: app tier + edge](22-final-project.md)
    ([old link](14-final-project.md) redirects here)

---

## What you should end up with

- Describe inventory groups, `ansible_host`, and `all:vars`.
- Run ad-hoc checks and write idempotent playbooks with `become`.
- Explain **why** variables exist; place them in inventory vs `group_vars` vs `host_vars`.
- Use **facts** (`ansible_default_ipv4`, `ansible_distribution`) instead of hard-coded IPs/OS.
- Structure a repo with **roles**, `defaults`, `group_vars`, and `host_vars`.
- Render config with **Jinja2 templates** and restart services with **handlers**.
- Encrypt secrets with **ansible-vault** (lab pattern).
- Drive hosts from **lists** (`loop`), slice work with **tags**, recover with **block/rescue**, and roll **`serial: 1`**.
- Debug `UNREACHABLE`, `permission denied`, and “changed every run” drift.
- Explain when Ansible fits vs shell scripts, cloud-init, or Terraform.
- Know what this course **leaves out** (collections, dynamic inventory, Molecule, AWX).

## Related

| Course | Relation |
|--------|----------|
| [linux-basic](../linux-basic/README.md) | SSH, users, systemd |
| [linux-advanced](../linux-advanced/README.md) | Chapter 18 preview; hardening capstone overlap |
| [gitlab-cicd](../gitlab-cicd/README.md) | Run playbooks from CI (optional next step) |
| [aws-terraform](../aws-terraform/README.md) | Provision VMs; Ansible configures them |
