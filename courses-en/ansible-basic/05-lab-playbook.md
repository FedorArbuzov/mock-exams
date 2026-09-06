# 05. Lab: nginx on `web`

## Goal

Write your first playbook: install and start **nginx** on **`web`** only, drop a simple `index.html`, verify with `curl` from `lab`.

## Prerequisites

- [03-lab-inventory.md](03-lab-inventory.md) — `ansible all -m ping` works

## Task 1. Playbook

In `~/ansible-lab`, create `web-nginx.yml`:

```yaml
---
- name: Nginx on web tier
  hosts: web
  become: true
  tasks:
    - name: Install nginx
      apt:
        name: nginx
        state: present
        update_cache: true

    - name: Deploy welcome page
      copy:
        dest: /var/www/html/index.html
        mode: "0644"
        content: |
          <h1>ansible-basic web</h1>
          <p>Managed by Ansible</p>

    - name: Ensure nginx running
      systemd:
        name: nginx
        state: started
        enabled: true
```

## Task 2. Run and re-run

```bash
ansible-playbook web-nginx.yml
ansible-playbook web-nginx.yml   # expect changed=0 on apt/copy/systemd
```

## Task 3. Verify HTTP

From `lab`:

```bash
curl -s http://172.28.0.20/ | head
```

You should see the HTML title.

## Task 4. Optional dry-run

```bash
ansible-playbook web-nginx.yml --check
```

Note: `copy` with `content` may still show `changed` in check mode — that is normal.

## Success criteria

- [ ] Playbook completes with `failed=0`  
- [ ] `curl http://172.28.0.20/` shows your message  
- [ ] Second playbook run reports no changes (or only `ok`)  
- [ ] `srv1` / `srv2` were **not** modified (only `hosts: web`)  

## If it fails

| Symptom | Try |
|---------|-----|
| `Failed to connect` to web | `ansible web -m ping` |
| `403` or default nginx page | Wrong `dest` — Ubuntu uses `/var/www/html` |
| `nginx` failed to start | `ansible web -m command -a 'nginx -t' -b` |

Keep `web-nginx.yml` — you will refactor it into a role later.

Next: [06. Variables: why they exist and where they live](06-variables-facts.md).
