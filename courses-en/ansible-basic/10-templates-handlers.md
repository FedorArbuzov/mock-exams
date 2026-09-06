# 10. Templates: generate config from variables

## Intro: `copy` with `content:` hits a wall

Lab 09’s index page is a few HTML lines — `copy.content` is fine. A real nginx **vhost** has `listen`, `server_name`, `root`, later `proxy_pass` to srv1:8080, maybe two backends, maybe an `if` for staging. Pasting that YAML blob into `tasks/main.yml` is unreadable. One missed space breaks nginx.

A **Jinja2 template** (`.j2` file) is the config file with holes: `{{ nginx_listen_port }}`. The **`template`** module renders it on the control node (using that host’s variables and facts) and writes the result to the target.

Reloading nginx only when the file **changes** is the next lesson: [10b](10b-handlers.md).

## What you'll learn

- `copy` vs `template` — when each is enough.
- `roles/nginx/templates/*.j2` and `src:` (no path prefix).
- Jinja `{{ }}`, `{% if %}`, `{% for %}` for a vhost and an upstream list.
- The nginx `$uri` vs Jinja `{{ }}` trap.
- `validate`, `--diff`, and file mode.

---

## `copy` vs `template`

| Need | Module |
|------|--------|
| Fixed bytes, no variables | `copy` (`src:` from `files/` or `content:`) |
| A few interpolated lines (MOTD, marker) | `copy` + `content: \|` with `{{ }}` |
| Multi-line config, loops, conditionals | **`template`** |

`content:` **is** Jinja. Templates are for files you want to **review in git** as configs, not as YAML strings.

---

## Where the `.j2` lives

Inside a role, `src: ansible-lab.conf.j2` loads `roles/nginx/templates/ansible-lab.conf.j2`. You do **not** write `src: templates/ansible-lab.conf.j2`.

```yaml
- name: Deploy vhost
  template:
    src: ansible-lab.conf.j2
    dest: /etc/nginx/sites-available/ansible-lab.conf
    mode: "0644"
    validate: "nginx -t -c /etc/nginx/nginx.conf"
```

`validate` runs **on the target** before replacing the file. If `nginx -t` fails, the old file stays. The `-c` path is the **main** nginx.conf (which `include`s `sites-enabled`). Validating only the fragment can miss context; `nginx -t` after the symlink exists is what ops actually run. In lab 11 you can add validate once the site is enabled, or run a separate `command: nginx -t` task.

Debian layout:

```text
sites-available/ansible-lab.conf   ← file you template
sites-enabled/ansible-lab.conf     ← symlink
sites-enabled/default              ← Ubuntu default; disable it or it steals `/`
```

---

## A vhost that uses your variables

`host_vars/web.yml` (from the next lab):

```yaml
nginx_server_name: shop.lab.local
nginx_listen_port: 80
nginx_docroot: /var/www/html
```

Template:

```jinja2
{# roles/nginx/templates/ansible-lab.conf.j2 #}
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

Rendered on **web**:

```nginx
server {
    listen 80;
    server_name shop.lab.local;
    ...
    try_files $uri $uri/ =404;
}
```

`$uri` is **nginx’s** variable. Jinja does not touch `$...`. If you write `{{ uri }}`, Ansible looks for a variable named `uri` and usually fails.

---

## Conditionals — staging vs production banners

Facts and `app_env` work inside templates the same as in tasks:

```jinja2
server {
    listen {{ nginx_listen_port }};
    server_name {{ nginx_server_name }};

{% if nginx_extra_headers | default(false) %}
    add_header X-Lab-Env "{{ nginx_server_name }}";
{% endif %}

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Whitespace: Jinja `{% if %}` lines should sit where you want the nginx directives. `{%-` / `-%}` strips spaces if a blank line bothers you — optional.

---

## Loops — several app backends

The finale proxies to the app tier. A list in group_vars:

```yaml
# group_vars/web.yml  (or host_vars/web.yml)
nginx_upstreams:
  - 172.28.0.11:8080
  - 172.28.0.12:8080
```

```jinja2
upstream nimbus_app {
{% for backend in nginx_upstreams %}
    server {{ backend }};
{% endfor %}
}

server {
    listen {{ nginx_listen_port }};
    server_name {{ nginx_server_name }};

    location / {
        proxy_pass http://nimbus_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Lab 11 can start with a **single** `proxy_pass http://172.28.0.11:8080` (or a static file vhost). The loop is the pattern you will need in the [finale](22-final-project.md). Course example: [examples/roles/nginx/templates/ansible-lab.conf.j2](examples/roles/nginx/templates/ansible-lab.conf.j2).

---

## Facts inside templates

```jinja2
# {{ ansible_managed }}
# rendered for {{ inventory_hostname }} ({{ ansible_default_ipv4.address }})
```

`ansible_managed` is a built-in string (“Ansible managed”). Putting the IP in a **comment** is useful when you `ssh web` and read the file; do not listen on a fact-based address unless you intend to.

---

## `template` module options worth setting

```yaml
- name: Deploy vhost
  template:
    src: ansible-lab.conf.j2
    dest: /etc/nginx/sites-available/ansible-lab.conf
    owner: root
    group: root
    mode: "0644"
    backup: true
  notify: Reload nginx
```

`backup: true` keeps `ansible-lab.conf.<timestamp>` on change — handy on the stand when you break syntax.

See the rendered file without guessing:

```bash
ansible-playbook site.yml --check --diff
ansible-playbook site.yml --diff
```

`--diff` shows the unified diff of the remote file. `--check` tries not to change it (not every module is perfect in check mode).

Enable the site:

```yaml
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
```

Without removing `default`, Ubuntu’s default server may still answer `curl http://172.28.0.20/` depending on `server_name` matching.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `src: templates/site.conf.j2` inside a role | file not found — drop the `templates/` prefix |
| `try_files {{ uri }}` | undefined `uri`; use `$uri` |
| Forgot `sites-enabled` symlink | nginx still serves the default site |
| Templating `nginx.conf` from scratch badly | you wipe `include`s and break the whole daemon |
| No quotes in YAML when dest starts with `{{` | YAML parse error — quote the string |

---

## In production

- Review template diffs in CI (`--check --diff`).
- Prefer vendor snippets + `include` over one 400-line `.j2`.
- `ansible_managed` comments help later humans not edit by hand.

---

## Summary

**Templates** turn variables and facts into files Ansible can diff and validate. Keep nginx’s `$variables` distinct from Jinja `{{ }}`. **Handlers** (next) reload the service **once** when those files change.

## Checklist

- [ ] When is `copy.content` enough, and when do you need a `.j2` file?
- [ ] Where does `src: ansible-lab.conf.j2` look inside a role?
- [ ] Why must `try_files` use `$uri` and not `{{ uri }}`?
- [ ] What does `ansible-playbook --diff` show you?

Next: [10b. Handlers: reload once when config changes](10b-handlers.md).
