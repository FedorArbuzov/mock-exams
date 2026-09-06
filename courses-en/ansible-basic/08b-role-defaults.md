# 08b. Role defaults, parameters, dependencies

## Intro: the role is useless if callers cannot change the port

[Lesson 08](08-roles.md) put nginx tasks in `roles/nginx`. If `listen` is hard-coded as `80` inside `tasks/main.yml`, you are back to editing task files for every environment. The contract is: **tasks read `{{ nginx_* }}`; `defaults/main.yml` supplies values; inventory / `group_vars` / `host_vars` override them.**

That is how `shop.lab.local` on **web** can differ from a second vhost later without forking the role.

## What you'll learn

- `defaults/main.yml` as the public API.
- `vars/main.yml` vs defaults (when a value must not be overridden).
- Passing variables at the `roles:` call site.
- Precedence reminder: defaults lose to `group_vars`.
- `meta/main.yml` dependencies (`app` always needs `common`).

---

## `defaults/main.yml` — knobs, not secrets

```yaml
# roles/nginx/defaults/main.yml
nginx_package: nginx
nginx_service: nginx
nginx_docroot: /var/www/html
nginx_listen_port: 80
nginx_server_name: "{{ inventory_hostname }}"
nginx_index_content: |
  <h1>ansible-basic web</h1>
  <p>Role: nginx</p>
```

**Naming:** prefix with the role name (`nginx_listen_port`, not `port`). Two roles can both have a `port` internally; they must not both expose a bare `port` in defaults.

Defaults may use Jinja (`nginx_server_name: "{{ inventory_hostname }}"`). Override in `host_vars/web.yml` when the public name is **not** the inventory name:

```yaml
# host_vars/web.yml
nginx_server_name: shop.lab.local
nginx_listen_port: 80
```

`host_vars` **beats** role defaults. You do not edit `defaults/main.yml` for one host.

---

## `vars/main.yml` — private constants

```yaml
# roles/nginx/vars/main.yml
nginx_debian_module_path: /usr/lib/nginx/modules
```

`vars/` has **higher** precedence than `group_vars` / `host_vars`. Callers **cannot** override these without extra-vars tricks. Use `vars/` for paths that are facts of the package layout, not for `nginx_listen_port`.

In this course, **leave `vars/main.yml` empty or delete it.** If you put `nginx_package` there, lab 11’s `host_vars` will mysteriously lose.

| File | Precedence vs inventory | Intent |
|------|-------------------------|--------|
| `defaults/main.yml` | **loses** — callers override | API |
| `vars/main.yml` | **wins** over group/host vars | internal |

---

## Precedence with a role (lab-shaped)

Low → high (simplified):

```text
roles/nginx/defaults/main.yml
    group_vars / host_vars / inventory
        play vars:
            extra vars -e
```

Example:

| Source | `nginx_server_name` |
|--------|---------------------|
| defaults | `{{ inventory_hostname }}` → `web` |
| `host_vars/web.yml` | `shop.lab.local` |
| Effective on web | **`shop.lab.local`** |

`ansible-playbook site.yml -e nginx_listen_port=8080` would force 8080 even if host_vars says 80.

Debug:

```bash
ansible-inventory --host web
# then
ansible web -m debug -a 'var=nginx_server_name'
```

The debug task only sees the var after the role’s defaults are in play — run it **inside** the role or after `roles:` in a play that includes nginx. `ansible-inventory` does **not** load role defaults. That surprises people: inventory merge ≠ role defaults.

---

## Parameters at the call site

```yaml
- name: Web stack
  hosts: web
  become: true
  roles:
    - role: nginx
      vars:
        nginx_listen_port: 8080
```

This sets `nginx_listen_port` for **that role invocation** (play-level role params). Useful when the same role is applied twice with different knobs (two vhosts — advanced). For this course, prefer `host_vars/web.yml` so `site.yml` stays a dumb index.

Old syntax `nginx_listen_port: 8080` as a sibling key under the role list item is the same idea.

---

## Dependencies in `meta/main.yml`

If every app server **must** get `common` first:

```yaml
# roles/app/meta/main.yml
---
dependencies:
  - role: common
```

Then:

```yaml
- hosts: app
  become: true
  roles:
    - app
```

Ansible inserts `common` before `app`. You can still list `common` explicitly in `site.yml` (lab 09 does that for clarity). Duplicate `common` in both places is usually **OK** — Ansible can skip a role already applied in the play depending on version/config; in the lab, listing `common` once in `site.yml` is enough. Use `meta` dependencies when a role **cannot** be used safely alone (app role assumes a user created by `common`).

Do not create a cycle (`common` depends on `app` depends on `common`).

---

## Splitting `tasks/main.yml`

When `main.yml` grows:

```yaml
# roles/nginx/tasks/main.yml
---
- import_tasks: install.yml
- import_tasks: vhost.yml
- import_tasks: service.yml
```

`import_tasks` is static (parsed with the play). `include_tasks` is dynamic (can loop). For this course, one `main.yml` is enough until templates land in lesson 10.

---

## Role README as the contract

A short `roles/nginx/README.md` prevents “which variable was it?”:

```markdown
# nginx (lab)

## Variables

| Name | Default | Meaning |
|------|---------|---------|
| nginx_listen_port | 80 | listen port |
| nginx_server_name | inventory_hostname | server_name |
| nginx_docroot | /var/www/html | site root |
```

The finale and other people will thank you. Optional in lab 09; expected in real repos.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| App settings in `vars/main.yml` | `host_vars` cannot override — “variable ignored” |
| Unprefixed `port: 80` in defaults | collides with another role’s `port` |
| Changing defaults to fix one host | every host that relied on the default breaks |
| Dependency on a role that is not in `./roles` | role not found at parse time |
| Expecting `ansible-inventory --host web` to show `nginx_server_name` from defaults | inventory does not load roles |

---

## In production

- Treat defaults as documented API; breaking a variable name is a version bump.
- Collections namespace variables (`nginx_core_listen`) to avoid collisions.
- `include_role` + `allow_duplicates` for multiple vhosts from one role — not required here.

---

## Summary

**`defaults/`** are overridable knobs; **`vars/`** are sticky internals. **`host_vars` / `group_vars`** override defaults. **`meta` dependencies** pull in `common` when a role cannot stand alone. Lab 09 extracts nginx + common from your old playbook.

## Checklist

- [ ] defaults vs group_vars — which wins?
- [ ] Why prefix variables with `nginx_`?
- [ ] When would you use `vars/main.yml` instead of defaults?
- [ ] Does `ansible-inventory --host` include role defaults?

Next lab: [09. Lab: extract an nginx role](09-lab-roles.md).
