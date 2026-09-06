# 11. Lab: vhost from a template

## Goal

Extend **`roles/nginx`** with a Jinja2 vhost, **`host_vars/web.yml`**, and a **handler** that reloads nginx **only** when the rendered file changes. Prove it with a second idempotent run, then change a variable and watch `RUNNING HANDLER`.

## Why this matters

`copy.content` cannot comfortably hold a real `server { }` block. After this lab, `shop.lab.local` lives in `host_vars` — the same pattern the [final project](22-final-project.md) uses for the reverse proxy.

## Prerequisites

- [09-lab-roles.md](09-lab-roles.md) — `site.yml` + `roles/nginx` + `roles/common`
- Theory: [10](10-templates-handlers.md), [10b](10b-handlers.md)

```bash
cd ~/ansible-lab
```

---

## Task 1. Defaults + host_vars

Add to `roles/nginx/defaults/main.yml` (keep existing keys):

```yaml
nginx_listen_port: 80
nginx_server_name: "{{ inventory_hostname }}"
```

`host_vars/web.yml`:

```yaml
nginx_server_name: shop.lab.local
nginx_listen_port: 80
```

Inventory host is `web`; public name is `shop.lab.local`. That is why `host_vars` exists.

---

## Task 2. Template

Create `roles/nginx/templates/ansible-lab.conf.j2`:

```jinja2
# {{ ansible_managed }}
# host={{ inventory_hostname }} ip={{ ansible_default_ipv4.address }}

server {
    listen {{ nginx_listen_port }};
    server_name {{ nginx_server_name }};

    root {{ nginx_docroot }};
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Use `$uri` (nginx), not `{{ uri }}`. Example copy: [examples/roles/nginx/templates/ansible-lab.conf.j2](examples/roles/nginx/templates/ansible-lab.conf.j2) — that file proxies to the app; for **this** lab the `try_files` version above is enough. You will switch to `proxy_pass` in the finale.

---

## Task 3. Tasks + handler

In `roles/nginx/tasks/main.yml`, **after** package install (index `copy` can stay), add:

```yaml
- name: Deploy vhost
  template:
    src: ansible-lab.conf.j2
    dest: /etc/nginx/sites-available/ansible-lab.conf
    mode: "0644"
  notify: Reload nginx

- name: Enable site
  file:
    src: /etc/nginx/sites-available/ansible-lab.conf
    dest: /etc/nginx/sites-enabled/ansible-lab.conf
    state: link
  notify: Reload nginx

- name: Disable default site
  file:
    path: /etc/nginx/sites-enabled/default
    state: absent
  notify: Reload nginx

- name: Validate nginx config
  command: nginx -t
  changed_when: false
```

`roles/nginx/handlers/main.yml`:

```yaml
---
- name: Reload nginx
  systemd:
    name: "{{ nginx_service }}"
    state: reloaded
```

`notify: Reload nginx` must match `name: Reload nginx` exactly.

Keep the existing install / index / systemd `started` tasks.

---

## Task 4. Run twice

```bash
ansible-playbook site.yml
ansible-playbook site.yml --diff
```

First run: template `changed`, then **RUNNING HANDLER [nginx : Reload nginx]**.

Second run: template `ok`, handler **absent** from the recap. `--diff` should show no vhost diff.

Verify:

```bash
ansible web -m command -a 'nginx -t' -b
curl -s -H 'Host: shop.lab.local' http://172.28.0.20/ | head
ansible web -m command -a 'grep server_name /etc/nginx/sites-available/ansible-lab.conf' -b
```

You should see `server_name shop.lab.local` and your index HTML.

---

## Task 5. Change a variable — prove the handler

Edit `host_vars/web.yml`:

```yaml
nginx_server_name: shop2.lab.local
nginx_listen_port: 80
```

```bash
ansible-playbook site.yml
ansible web -m command -a 'grep server_name /etc/nginx/sites-available/ansible-lab.conf' -b
```

Expect **changed** on `template` + **RUNNING HANDLER**. Set the name back to `shop.lab.local` so later labs match the finale (`shop.lab.local`).

```bash
# restore
# nginx_server_name: shop.lab.local
ansible-playbook site.yml
```

---

## Success criteria

- [ ] `server_name shop.lab.local` appears on web (`grep` or `nginx -T`)  
- [ ] Handler runs after the first apply and after a variable change  
- [ ] Second run with no edits does **not** run the handler  
- [ ] `nginx -t` succeeds  
- [ ] Default site disabled (or your vhost is the one that answers `/`)  

---

## If it fails

| Symptom | Try |
|---------|-----|
| `nginx: configuration file test failed` | Read `ansible web -m command -a 'nginx -t' -b` stderr; `$uri` vs `{{ uri }}` |
| Still Ubuntu default page | `sites-enabled/default` still present; use `curl -H 'Host: shop.lab.local'` |
| Handler never runs | `notify` string ≠ handler `name`; template not `changed` |
| `src` file not found | file must be `roles/nginx/templates/ansible-lab.conf.j2` |
| Handler every run | something always `changed` — check `command` without `changed_when` |

Next: [12. ansible-vault and secret hygiene](12-vault-secrets.md).
