# 22. Final project: app tier + edge

## Story

**Nimbus Shop** needs a repeatable baseline:

- **web** — nginx reverse proxy to the app tier, custom vhost `shop.lab.local`
- **srv1**, **srv2** — `deploy` user, static **app** page on port **8080** (python `http.server` via systemd for the lab)
- Secrets — DB password in **ansible-vault** (file on disk, not in plaintext git)

You deliver one repo layout under `~/ansible-lab` and a single **`site.yml`** entrypoint.

This project reuses the theory you already practiced:

| Need | Lesson |
|------|--------|
| `group_vars` / `host_vars` / `shop.lab.local` | [06](06-variables-facts.md), [07](07-lab-variables.md), [11](11-lab-templates.md) |
| Facts in templates (optional comments, bind address) | [06b](06b-facts.md) |
| `roles/nginx` + `roles/app` + `site.yml` | [08](08-roles.md), [08b](08b-role-defaults.md), [09](09-lab-roles.md) |
| vhost `.j2` + `notify` reload | [10](10-templates-handlers.md), [10b](10b-handlers.md) |
| Encrypted `vault_db_password`, `no_log`, mode `0600` | [12](12-vault-secrets.md) |
| Package/user lists, tags, `serial: 1` on the app play | [15](15-loops.md)–[21](21-lab-rollout.md) |

## Stand

[ENVIRONMENT.md](ENVIRONMENT.md) — `deploy/linux` up, Ansible on **`lab`**.

## Fixed values

| Item | Value |
|------|--------|
| Proxy `server_name` | `shop.lab.local` |
| App listen port | `8080` |
| App index text | must contain `nimbus-app` |
| Deploy user | `deploy` (member of `sudo`, NOPASSWD on stand OK) |
| Vault file | `group_vars/all/vault.yml` encrypted |
| Vault variable | `vault_db_password: nimbus-db-2026` |
| Marker on app hosts | `/etc/nimbus-configured` |

## Suggested layout

```text
ansible-lab/
  site.yml
  ansible.cfg
  inventory/lab.ini
  group_vars/all/vault.yml          # encrypted — vault_db_password
  group_vars/all/vars.yml           # db_password: "{{ vault_db_password }}"
  group_vars/app.yml                # app_port, app_user, …
  host_vars/web.yml                 # nginx_server_name: shop.lab.local
  host_vars/srv1.yml                # optional: app_env: staging
  roles/
    nginx/
    app/
  scripts/verify-final.sh
```

Do **not** create `group_vars/all.yml` *and* `group_vars/all/` — pick the **directory** form so vault and plaintext sit together.

Example starters: [examples/](examples/README.md).

### Where each value lives

| Value | File | Why |
|-------|------|-----|
| `ansible_user`, `ansible_host` | `inventory/lab.ini` | connection |
| `vault_db_password` | `group_vars/all/vault.yml` (encrypted) | secret |
| `db_password` | `group_vars/all/vars.yml` | maps vault → normal name |
| `app_port: 8080`, `app_user: deploy` | `group_vars/app.yml` or `roles/app/defaults` | shared by srv1+srv2 |
| `nginx_server_name` | `host_vars/web.yml` | only web |
| `nginx_listen_port` | role defaults, override in host_vars if needed | |

## Requirements

### 1. Roles

- **`nginx`** on `web` — template vhost; `/` proxies to `http://172.28.0.11:8080` (primary app; optional backup srv2 is bonus).
- **`app`** on `app` — user `deploy`, directory `/opt/nimbus/app`, systemd unit `nimbus-app.service` serving index with `nimbus-app`.

### 2. Vault

- Encrypt `group_vars/all/vault.yml` with `vault_db_password`.
- Template or copy `/etc/nimbus/db.env` on app hosts with `DB_PASSWORD={{ db_password }}`, mode `0600`, task uses `no_log: true`.

### 3. Idempotency

Second `ansible-playbook site.yml` → no unnecessary `changed` (handlers may still be ok).

### 4. Playbook control (from 15–21)

Not checked by `verify-final.sh`, but expected in a complete `site.yml`:

- App packages or directories from a **list** in `group_vars` ([15](15-loops.md)).
- Tags such as `nginx` / `app` so `--tags nginx` is usable ([17](17-tags.md)).
- The **app** play uses `serial: 1` if it restarts `nimbus-app` ([20](20-rolling.md)).

## Verification

On **`lab`**:

```bash
cd ~/ansible-lab
ansible-playbook site.yml --ask-vault-pass
./scripts/verify-final.sh --vault-password-file ~/.vault_pass_lab
```

Or copy [scripts/verify-final.sh](scripts/verify-final.sh) from the course repo.

### Manual checks

```bash
curl -s -H 'Host: shop.lab.local' http://172.28.0.20/ | grep nimbus-app
curl -s http://172.28.0.11:8080/ | grep nimbus-app
ansible app -m command -a 'id deploy'
ansible app -b -m command -a 'test -f /etc/nimbus/db.env && echo ok'
ansible-playbook site.yml --list-tags
```

## Rubric

| Area | Points |
|------|--------|
| Inventory + SSH | all hosts reachable |
| `site.yml` structure | roles, become, correct hosts |
| nginx proxy | vhost + proxy_pass to app |
| app role | user, systemd, port 8080 |
| vault | encrypted file, no plaintext password in git |
| idempotency | second run clean |
| verify script | passes |
| tags / serial (bonus in verify) | `--list-tags` works; app restart is batched |

## Bonus

- upstream block with srv1 + srv2 ([10](10-templates-handlers.md) loop)
- `block`/`rescue` around `nginx -t` ([18](18-blocks.md))
- `ansible-lint` clean
- GitLab CI job running `ansible-playbook --check` ([`gitlab-cicd`](../gitlab-cicd/README.md))

## Demo script (5 min)

1. `ansible all -m ping`
2. `ansible-playbook site.yml --ask-vault-pass` (show changed; two recaps if app play is `serial: 1`)
3. Re-run (show ok)
4. `curl` through web Host header
5. `./scripts/verify-final.sh`

## Cleanup

```bash
# on lab — optional teardown play or:
ansible app -b -m systemd -a 'name=nimbus-app state=stopped enabled=no'
ansible app -b -m user -a 'name=deploy state=absent remove=yes'

# reset entire stand
exit
cd deploy/linux && docker compose down -v
```

## Self-check

- [ ] Why is the control node not in `[app]` or `[web]` groups for deployment?
- [ ] What breaks if you forget `--ask-vault-pass`?
- [ ] How would you add a staging environment without duplicating roles?
- [ ] Why restart the app play with `serial: 1`?

This course stops at **configuration on SSH Linux hosts**. Not covered here: collections, dynamic inventory, Molecule, AWX, lookups into HashiCorp Vault — those belong in a later Ansible track and in [`gitlab-cicd`](../gitlab-cicd/README.md) / [`kuber-vault`](../kuber-vault/README.md).

Congratulations — next steps: CI integration, Molecule tests, or [`linux-advanced`](../linux-advanced/README.md) hardening capstone with Ansible.
