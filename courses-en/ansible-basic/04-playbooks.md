# 04. Playbooks, modules, idempotency

## Intro: ad-hoc does not scale

Three tasks on two hosts is fine ad-hoc. Twenty tasks with ordering, tags, and rollback belongs in a **playbook** — YAML listing **plays** (host pattern + task list).

## What you'll learn

- Play / task / module structure.
- `become` for privilege escalation.
- `--check` dry run and `--diff`.
- Handlers preview (full lesson: [10b](10b-handlers.md)).

---

## Minimal playbook

```yaml
# site.yml
---
- name: Web tier baseline
  hosts: web
  become: true
  tasks:
    - name: Ensure nginx package
      apt:
        name: nginx
        state: present
        update_cache: true

    - name: Ensure nginx started
      systemd:
        name: nginx
        state: started
        enabled: true
```

Run:

```bash
ansible-playbook site.yml
ansible-playbook site.yml   # second run → mostly ok/changed=0
```

---

## Anatomy

| Key | Meaning |
|-----|---------|
| `hosts:` | inventory pattern (`web`, `app`, `all`, `srv1`) |
| `become: true` | use sudo (NOPASSWD for `course` on stand) |
| `tasks:` | ordered list |
| `name:` | human-readable log line (always set it) |
| module keys | module-specific (`apt`, `copy`, …) |

---

## Useful flags

```bash
ansible-playbook site.yml --check        # dry-run (not all modules support it)
ansible-playbook site.yml --diff         # show file diffs
ansible-playbook site.yml --limit srv1
ansible-playbook site.yml -v             # more verbosity
ansible-playbook site.yml --tags nginx   # if you add tags
```

---

## Modules you will use often

| Module | Purpose |
|--------|---------|
| `apt` | Debian packages |
| `copy` | push file with fixed content |
| `template` | Jinja2 → file on host |
| `file` | permissions, directories, symlinks |
| `user` / `group` | accounts |
| `systemd` | service state |
| `lineinfile` / `blockinfile` | single config lines (use sparingly) |

Prefer **`copy`/`template`** over `shell echo >>`.

---

## Register and debug (preview)

```yaml
- name: Check nginx config
  command: nginx -t
  register: nginx_test
  changed_when: false

- debug:
    var: nginx_test.stderr_lines
  when: nginx_test.rc != 0
```

`changed_when: false` — this task is a **check**, not a change. Full treatment of `register`, `when`, and facts vs your own variables: [06c](06c-register-when.md).

---

## Common mistakes

| Mistake | Consequence |
|---------|-------------|
| No `become` for `/etc` files | permission denied |
| `command: nginx -t && systemctl reload` | use `shell` or split tasks + handler |
| Editing playbook while run is in flight | mixed state |
| `state: latest` everywhere | surprise upgrades in prod |

---

## In production

- One playbook per **concern** or use **roles** (next chapters).
- Pin package versions or use your mirror policy explicitly.
- CI: `ansible-lint` + `ansible-playbook --check` on PRs.

---

## Summary

**Playbooks** are versioned automation. **Modules** express desired state; **`become`** runs privileged tasks safely on Ubuntu.

## Checklist

- [ ] What does `become: true` do on our stand?
- [ ] Why run the playbook twice in a lab?
- [ ] When is `--check` misleading?

Next lab: [05. Lab: nginx on web](05-lab-playbook.md).
