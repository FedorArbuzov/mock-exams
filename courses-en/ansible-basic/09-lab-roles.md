# 09. Lab: extract an nginx role

## Goal

Turn [lab 05](05-lab-playbook.md)’s `web-nginx.yml` into **`roles/nginx`**, add **`roles/common`** (a marker on every host), and drive both from **`site.yml`**. After this, changing nginx means editing the role once — not hunting copied playbooks.

## Prerequisites

- `web-nginx.yml` worked (HTTP on `172.28.0.20`)
- Theory: [08](08-roles.md), [08b](08b-role-defaults.md)

```bash
cd ~/ansible-lab
```

---

## Task 1. Create role skeletons

```bash
ansible-galaxy role init nginx --offline
ansible-galaxy role init common --offline
```

If `--offline` is unsupported on your Ansible version, omit it. You should have `roles/nginx/tasks/main.yml` and `roles/common/tasks/main.yml`.

Replace the generated `tasks/main.yml` content (it is a stub).

---

## Task 2. `roles/nginx/defaults/main.yml`

```yaml
nginx_package: nginx
nginx_service: nginx
nginx_docroot: /var/www/html
nginx_index_content: |
  <h1>ansible-basic web</h1>
  <p>Role: nginx</p>
```

This is the API. Tasks must not hard-code `nginx` as the package name if they can use `{{ nginx_package }}`.

---

## Task 3. `roles/nginx/tasks/main.yml`

Full file — do not leave `web-nginx.yml` as the source of truth:

```yaml
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

---

## Task 4. `roles/common/tasks/main.yml`

```yaml
---
- name: Lab configured marker
  copy:
    dest: /etc/ansible-lab-role-common
    mode: "0644"
    content: "configured by common role on {{ inventory_hostname }}\n"
```

`common` does not need defaults for this lab. Optional: `roles/common/defaults/main.yml` with `common_marker_path: /etc/ansible-lab-role-common`.

---

## Task 5. `site.yml` at the repo root

```yaml
---
- name: Web tier
  hosts: web
  become: true
  roles:
    - common
    - nginx

- name: App tier baseline
  hosts: app
  become: true
  roles:
    - common
```

**web** gets both roles; **srv1** / **srv2** get only `common`. Role order on web: baseline first, then nginx.

You can keep `web-nginx.yml` as a backup but stop using it.

---

## Task 6. Run and prove targeting

```bash
ansible-playbook site.yml
curl -s http://172.28.0.20/ | head
ansible app -m command -a 'cat /etc/ansible-lab-role-common'
ansible web -m command -a 'cat /etc/ansible-lab-role-common'
ansible app -m command -a 'dpkg -l nginx' 
```

The last command should **fail** or show nginx **not** installed on app hosts (no nginx role there). web must still serve your HTML.

Second run:

```bash
ansible-playbook site.yml
```

Expect `changed=0` (or only incidental `ok`) on copy/apt/systemd.

---

## Task 7. Override a default without editing the role

`host_vars/web.yml` (create the file):

```yaml
nginx_index_content: |
  <h1>ansible-basic web</h1>
  <p>Overridden from host_vars</p>
```

```bash
ansible-playbook site.yml
curl -s http://172.28.0.20/
```

You should see `Overridden from host_vars`. This confirms [08b](08b-role-defaults.md): host_vars beat role defaults.

Restore the original HTML (or keep the override — lab 11 will set `nginx_server_name` here anyway).

---

## Success criteria

- [ ] `site.yml` applies **common** to web, srv1, and srv2  
- [ ] **nginx** role runs only on **web** (HTTP works; app hosts have no nginx from this play)  
- [ ] Second run is idempotent  
- [ ] Layout is `roles/nginx/tasks/main.yml` + `defaults/main.yml`  
- [ ] A `host_vars` override changed the index without editing the role  

---

## If it fails

| Symptom | Try |
|---------|-----|
| `role 'nginx' was not found` | cwd `~/ansible-lab`; directory `roles/nginx` not `role/nginx` |
| nginx tasks on app hosts | `nginx` must not appear under the app play |
| Old index still shown | `curl` (not a cached browser); confirm `copy.dest` is `/var/www/html/index.html` |
| `nginx_package` undefined | defaults file path must be `roles/nginx/defaults/main.yml` |
| `become` / apt permission denied | `become: true` on the play |

Next: [10. Templates: generate config from variables](10-templates-handlers.md).
