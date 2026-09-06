# 13. Lab: fix a broken playbook

## Goal

A teammate left **`broken-site.yml`** with three typical production bugs. Reproduce the failures with **`-v`**, fix them (or throw the file away and rely on your role-based `site.yml`), and leave **web** serving a valid nginx config.

Optional: encrypt a dummy vault var so [lesson 12](12-vault-secrets.md) is not only reading.

## Prerequisites

- Roles from [09](09-lab-roles.md) / [11](11-lab-templates.md) still present
- `ansible web -m ping` works

```bash
cd ~/ansible-lab
```

---

## Debug tools (use these on the broken run)

```bash
ansible-playbook broken-site.yml --syntax-check
ansible-playbook broken-site.yml -v
ansible-playbook broken-site.yml -vv
```

| Flag | Use |
|------|-----|
| `--syntax-check` | YAML / parse errors before SSH |
| `-v` | which task, some module args |
| `--check --diff` | dry-run + file diffs (on a **working** playbook) |
| `--start-at-task 'Ensure nginx service'` | resume after a fix (optional) |
| `ansible web -m command -a 'nginx -t' -b` | live config test |

Read the **first** failed task. Fixing later tasks while `become` is missing wastes time.

---

## Task 1. Broken playbook

Create `~/ansible-lab/broken-site.yml`:

```yaml
---
- name: Broken web deploy
  hosts: web
  tasks:
    - name: Install nginx without root
      apt:
        name: nginx
        state: present

    - name: Push config to wrong path
      copy:
        dest: /etc/nginx/nginx.conf
        content: |
          obviously broken nginx config

    - name: Restart nginx
      shell: systemctl restart nginx
```

Do **not** copy this into `roles/nginx`. It exists to fail.

---

## Task 2. Run and name the bugs

```bash
ansible-playbook broken-site.yml -v
```

You should be able to explain:

1. **Privilege** — `apt` writes to the system without `become: true` → permission denied.
2. **Blast radius** — overwriting **`/etc/nginx/nginx.conf`** with invalid text (instead of a vhost under `sites-available`) breaks the whole daemon.
3. **Idempotency** — `shell: systemctl restart nginx` always runs; no change reporting; fights your handler-based role.

If task 2 actually ran, `nginx -t` on web will fail until you restore config.

---

## Task 3. Fix (choose a path)

**Path A (recommended):** stop using `broken-site.yml`. Restore web from your known-good roles:

```bash
ansible-playbook site.yml
ansible web -m command -a 'nginx -t' -b
```

If `nginx.conf` was destroyed, reinstall the package or copy a default back:

```bash
ansible web -b -m apt -a 'name=nginx state=present'
# if nginx -t still fails, see "If nginx is still broken" below
ansible-playbook site.yml
```

**Path B:** patch `broken-site.yml` until it is harmless:

- `become: true` on the play
- **delete** the `copy` to `nginx.conf` — never replace the main config with a toy snippet
- replace `shell` with `systemd: name=nginx state=started enabled=true` (or notify a handler)

Path B is for learning; Path A is how you would recover at work (re-run the source of truth).

---

## Task 4. Verify recovery

```bash
ansible web -m command -a 'nginx -t' -b
curl -s http://172.28.0.20/ | head
ansible-playbook site.yml
```

`site.yml` must end with `failed=0`. HTTP should show **your** page, not an error.

---

## Task 5. Optional vault drill

```bash
mkdir -p group_vars/web
ansible-vault create group_vars/web/vault.yml
```

Inside the vault file:

```yaml
vault_banner_secret: "classified-chicken"
```

`host_vars/web.yml` (keep existing nginx keys):

```yaml
banner_secret: "{{ vault_banner_secret }}"
```

Temporary task in `roles/common` or a tiny `vault-smoke.yml`:

```yaml
---
- hosts: web
  gather_facts: false
  tasks:
    - debug:
        msg: "secret length {{ banner_secret | length }}"
      no_log: true
```

```bash
ansible-playbook vault-smoke.yml --ask-vault-pass
```

You should **not** see `classified-chicken` in the output. Remove the smoke playbook (or the debug task) so the finale does not depend on it. The finale uses `group_vars/all/vault.yml` instead — different path, same workflow.

---

## Success criteria

- [ ] You can explain all three bugs in `broken-site.yml`  
- [ ] `nginx -t` passes on web  
- [ ] `curl http://172.28.0.20/` returns your role-managed page  
- [ ] `site.yml` completes with `failed=0`  
- [ ] (Optional) vault file created; playbook run with `--ask-vault-pass`  

---

## If nginx is still broken

```bash
ansible web -b -m apt -a 'name=nginx state=present'
ansible web -b -m file -a 'path=/etc/nginx/sites-enabled/default state=absent'
# if nginx.conf is junk, reinstall:
ansible web -b -m apt -a 'name=nginx state=latest'  # lab-only recovery
ansible-playbook site.yml
```

Last resort: recreate the **web** container (`docker compose up -d --force-recreate web` from `deploy/linux`) and re-run `site.yml` after SSH keys still work (same `id_lab` on lab).

Next: [15. Loops: one task, many items](15-loops.md). Capstone: [22. Final project](22-final-project.md).
