# 17. Tags: run part of a playbook

## Intro: you do not always want the whole `site.yml`

`site.yml` installs packages, writes nginx templates, and restarts units. At 03:00 you only want to **reload nginx** after a `server_name` change. Re-running apt on every host is slow and noisy.

**Tags** mark tasks (and roles, and plays). You select them on the CLI:

```bash
ansible-playbook site.yml --tags nginx
ansible-playbook site.yml --skip-tags apt
ansible-playbook site.yml --tags users --limit srv1
```

Without tags, every task runs. Tags do not replace inventory groups: groups answer *which hosts*; tags answer *which work*.

## What you'll learn

- Tagging tasks, plays, and `roles:`.
- Special tags `always` and `never`.
- `--tags`, `--skip-tags`, `--list-tags`, `--list-tasks`.
- How `import_*` vs `include_*` inherit tags (just enough to not get surprised).

---

## Tag a task

```yaml
- name: Install nginx package
  apt:
    name: nginx
    state: present
  tags:
    - nginx
    - packages

- name: Deploy vhost
  template:
    src: ansible-lab.conf.j2
    dest: /etc/nginx/sites-available/ansible-lab.conf
  notify: Reload nginx
  tags:
    - nginx
    - config
```

```bash
ansible-playbook site.yml --tags config
```

Only tasks tagged `config` run (plus anything tagged `always`). The `apt` task is skipped.

Multiple tags on one task = “this task belongs to several slices.” `--tags nginx` and `--tags packages` both include the install task.

---

## Tag a role or a play

```yaml
- name: Web tier
  hosts: web
  become: true
  roles:
    - role: common
      tags: [baseline]
    - role: nginx
      tags: [nginx]
```

Tags on the role apply to **every task** in that role (with `import` semantics — see below).

Play-level:

```yaml
- name: App tier
  hosts: app
  become: true
  tags:
    - app
  roles:
    - common
    - app
```

`--tags app` runs that whole play.

---

## `always` and `never`

```yaml
- name: Gather facts reminder
  debug:
    msg: "{{ inventory_hostname }} {{ ansible_distribution }}"
  tags:
    - always
```

`always` runs even if you passed `--tags nginx`. Use it for facts you already have, or a tiny sanity `debug` — **not** for `apt: upgrade`.

```yaml
- name: Dangerous leftover
  command: rm -rf /tmp/nimbus-scratch
  tags:
    - never
```

`never` runs only if you **explicitly** `--tags never` (or name that tag). Good for one-off wipe tasks you do not want in a normal `site.yml` run.

---

## Discover tags before you guess

```bash
cd ~/ansible-lab
ansible-playbook site.yml --list-tags
ansible-playbook site.yml --list-tasks
ansible-playbook site.yml --list-tasks --tags nginx
```

`--list-tasks` is the safe way to check “what would `--tags users` actually run” without SSH.

---

## `import_*` vs `include_*` (tag inheritance)

| Directive | When parsed | Tags on the parent |
|-----------|-------------|--------------------|
| `import_tasks` / `import_role` / `import_playbook` | at parse time | apply to **all** imported tasks |
| `include_tasks` / `include_role` | at runtime | apply to the **include action**; inner tasks need their own tags unless you use `apply:` |

For this course: `roles:` in `site.yml` behaves like import. If you `include_tasks: vhost.yml` in the middle of a role, tag the include **and** the tasks, or use:

```yaml
- name: Vhost slice
  include_tasks: vhost.yml
  tags: [nginx]
  args:
    apply:
      tags: [nginx]
```

If `--tags nginx` “does nothing,” you included a file whose tasks are untagged.

`import_playbook: web.yml` in `site.yml` is how people split huge site files. Tags on the import apply to that playbook’s plays.

---

## Combine with `--limit`

```bash
ansible-playbook site.yml --tags config --limit web
ansible-playbook app-loop.yml --tags users --limit srv1
```

Canary: one host, one slice of work. [Lesson 20](20-rolling.md) adds `serial` for “one host at a time” *inside* a full play.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| No tags on the tasks you care about | `--tags nginx` runs **nothing** (except `always`) |
| Tagging only `site.yml` roles and expecting `include_tasks` children to match | children skipped |
| `tags: nginx` as a string vs list | works (Ansible accepts both); lists are clearer for two tags |
| Using tags instead of `when: app_env == 'staging'` | tags are operator choice; `when` is data — do not mix the jobs |
| Forgetting `become` still applies | tags do not drop privilege |

---

## In production

- Agree a small tag vocabulary: `packages`, `config`, `users`, `restart`. Too many tags = nobody remembers them.
- CI can run `--tags lint` or a syntax play; humans `--tags config` during an incident.
- `ansible-galaxy` roles often ship tags — list them before you wrap the role.

---

## Summary

**Tags** select a slice of tasks. **`--list-tags` / `--list-tasks`** before you run. **`always` / `never`** are the only special names you need. Groups pick hosts; tags pick work.

## Checklist

- [ ] How do you run only tasks tagged `config`?
- [ ] What still runs if you `--tags nginx` and a task is tagged `always`?
- [ ] Why might `--tags nginx` skip `include_tasks: vhost.yml` children?
- [ ] Tags vs `when` — which one belongs in inventory data?

Next: [18. block, rescue, always](18-blocks.md).
