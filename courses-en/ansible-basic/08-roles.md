# 08. Roles: stop copy-pasting playbooks

## Intro: three playbooks, three slightly different nginx tasks

`web-nginx.yml` from [lab 05](05-lab-playbook.md) works. The final project also needs a deploy user, an app unit, and a vhost template. The tempting path:

```text
web-nginx.yml   → copy → web-nginx-v2.yml   → copy → site.yml with 80 tasks
```

Two weeks later someone fixes `update_cache: true` in one file and not the others. **Roles** put “install nginx + drop files + start the service” in **one directory** that any playbook can call. `site.yml` becomes a short list: *who* gets *which* role.

## What you'll learn

- What a role is (a folder contract, not a new language).
- Standard layout: `tasks`, `defaults`, `handlers`, `templates`, `files`, `meta`.
- How Ansible **finds** `roles/nginx`.
- `ansible-galaxy role init` — what each generated file is for.
- `site.yml` with `roles:` vs a flat task list.

Defaults vs `vars/`, role parameters, and dependencies: [08b](08b-role-defaults.md). Hands-on: [lab 09](09-lab-roles.md).

---

## Mental model

```text
site.yml                      roles/nginx/
  play hosts: web               defaults/main.yml   ← public knobs
  roles: [common, nginx]        tasks/main.yml      ← what to do
                                handlers/main.yml   ← reload on change
                                templates/*.j2      ← lesson 10
                                files/              ← static blobs
                                meta/main.yml       ← dependencies
```

A **play** still answers “which hosts, become or not.” A **role** answers “how to make nginx (or a baseline) look like we want.” You can apply `common` to **web** and **app** without duplicating the MOTD task.

Ansible is not Kubernetes: a role is not a Pod. It is a reusable **recipe** plus default variables.

---

## Directory layout (what each path is for)

```text
roles/nginx/
  defaults/main.yml      # overridable defaults — the role's API
  vars/main.yml          # constants you do not want people to override (rare in labs)
  tasks/main.yml         # entrypoint — Ansible always starts here
  tasks/install.yml      # optional; imported from main.yml
  handlers/main.yml      # named handlers (lesson 10b)
  templates/             # Jinja2 — src: foo.j2 looks here
  files/                 # static — copy src: bar.txt looks here
  meta/main.yml          # galaxy_info + dependencies
  README.md              # what vars the caller must set
```

If `tasks/main.yml` is missing, the role is broken. Extra YAML under `tasks/` is **ignored** until `main.yml` `import_tasks` / `include_tasks` it.

| Path | You put |
|------|---------|
| `tasks/main.yml` | `apt`, `copy`, `systemd`, `template` |
| `defaults/main.yml` | `nginx_package: nginx` |
| `templates/` | `ansible-lab.conf.j2` |
| `files/` | a binary or a fixed `index.html` with no `{{ }}` |
| `handlers/` | `Reload nginx` |

**Do not** put inventory or `ansible.cfg` inside the role. Those stay at the repo root (`~/ansible-lab`).

---

## `tasks/main.yml` — the only required file

A minimal nginx role (enough for lab 09 before templates):

```yaml
# roles/nginx/tasks/main.yml
---
- name: Install nginx package
  apt:
    name: "{{ nginx_package }}"
    state: present
    update_cache: true

- name: Deploy index
  copy:
    dest: "{{ nginx_docroot }}/index.html"
    mode: "0644"
    content: "{{ nginx_index_content }}"

- name: Ensure nginx service
  systemd:
    name: "{{ nginx_service }}"
    state: started
    enabled: true
```

Compare with lab 05: same modules, but **names come from defaults** so `site.yml` does not hard-code paths.

`common` can be even smaller — one `copy` that stamps `/etc/ansible-lab-role-common`. Applying it to `[web]` and `[app]` is the reuse story: one task file, three hosts.

---

## How Ansible finds the role

When you write:

```yaml
roles:
  - nginx
```

Ansible looks for `roles/nginx/tasks/main.yml` relative to the playbook directory, then `roles_path` in `ansible.cfg`.

This course:

```text
~/ansible-lab/site.yml
~/ansible-lab/roles/nginx/tasks/main.yml
```

Run **from** `~/ansible-lab`. If you `ansible-playbook ~/ansible-lab/site.yml` from `~`, search still uses the playbook’s directory — usually OK — but `group_vars` resolution is easier if your cwd is the project root.

```ini
# ansible.cfg — optional extra search path
[defaults]
roles_path = ./roles
```

---

## Calling roles from `site.yml`

```yaml
---
- name: Web stack
  hosts: web
  become: true
  roles:
    - common
    - nginx

- name: App stack
  hosts: app
  become: true
  roles:
    - common
```

Order:

1. Plays run top to bottom (`web` play, then `app` play).
2. Inside a play, roles run **in list order** (`common` then `nginx` on web).
3. Inside a role, tasks run top to bottom.

`nginx` is **not** listed under the app play, so srv1/srv2 do not get a web server from this file. That is how you keep roles reusable without applying them everywhere.

### `roles:` vs tasks in the play

You can mix:

```yaml
- hosts: web
  become: true
  roles:
    - nginx
  tasks:
    - name: After roles
      debug:
        msg: "roles finished"
```

By default **roles run before** the play’s `tasks:`. For this course, put work **inside** roles and keep `site.yml` as an index.

`include_role` / `import_role` exist for looping and conditionals. Skip them until a role must run in the middle of a task list.

---

## `ansible-galaxy role init`

```bash
cd ~/ansible-lab
ansible-galaxy role init nginx
ansible-galaxy role init common
```

This creates the tree plus placeholders (`tests/`, `.travis.yml` on older galaxy). You will **replace** `tasks/main.yml` and `defaults/main.yml`. You do not need Galaxy hub (`geerlingguy.nginx`) in this course — installing random roles from the internet is how labs drift.

What to delete or ignore: CI stubs, empty `vars/main.yml` until you have a real constant.

---

## One role, one job

| Role | Owns | Does not own |
|------|------|----------------|
| `common` | MOTD, baseline packages, users every host needs | nginx vhosts |
| `nginx` | package, vhost, service | Python app on 8080 |
| `app` | deploy user, `/opt/nimbus`, systemd unit (finale) | reverse proxy |

A “god role” that installs nginx, PostgreSQL, and the app is hard to test and hard to apply to only `web`. Split at **service / baseline** boundaries.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| Tasks in `tasks/nginx.yml` but `main.yml` empty | nothing runs |
| Role directory `roles/Nginx` vs `roles: - nginx` | role not found (case / name mismatch) |
| Running from a directory without `roles/` | `ERROR! the role 'nginx' was not found` |
| Copying `apt:` tasks into `site.yml` **and** the role | double work, drift |
| Putting `host_vars` inside `roles/nginx/` | Ansible will not load them as host vars |

---

## In production

- Version roles with Git tags or a private Galaxy / collection.
- Molecule tests a role in Docker — same idea as our stand, automated.
- Collections (`ansible-galaxy collection`) package multiple roles; you will still think in “role = one service.”

---

## Summary

A **role** is a directory Ansible knows how to load. **`tasks/main.yml`** is the entrypoint; **`site.yml`** only maps **groups → roles**. Next lesson: the variable **API** of a role (`defaults` vs `vars`) and dependencies.

## Checklist

- [ ] Which file must exist for `roles: - nginx` to do anything?
- [ ] How do you apply `common` to web and app without duplicating tasks?
- [ ] Why is inventory not part of the role directory?

Next: [08b. Role defaults, parameters, dependencies](08b-role-defaults.md).
