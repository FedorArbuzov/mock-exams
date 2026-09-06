# 06. Variables: why they exist and where they live

## Intro: one playbook, three different hosts

You finished [lab 05](05-lab-playbook.md). The playbook hard-codes the welcome page and always targets `web`. Next week the same pattern hits the **app** tier: **srv1** is staging (`app_env: staging`, port `8080`), **srv2** is production (`app_env: production`, same port). A teammate copies `web-nginx.yml` to `srv1-app.yml` and `srv2-app.yml`, then edits hostnames by hand.

On Monday someone changes the listen port. They update **one** file. Staging and production diverge. That is the bug variables exist to prevent.

A **variable** is a named value Ansible fills in at runtime. The **same** task text runs on every host; the **value** comes from inventory, `group_vars`, `host_vars`, the play, or the CLI.

## What you'll learn

- Why hard-coding in tasks does not scale past one host.
- The files Ansible actually reads: inventory, `group_vars/`, `host_vars/`, play `vars:`.
- Group file vs group **directory** (`group_vars/app.yml` vs `group_vars/app/`).
- Simplified **precedence** (who wins when the same name is set twice).
- How to debug the merge with `ansible-inventory --host`.

Facts (`ansible_distribution`, IP addresses) are the next lesson: [06b](06b-facts.md). `register` / `when` are [06c](06c-register-when.md).

---

## The pain without variables

A playbook that “works” for one host:

```yaml
- name: App marker (do not copy this)
  hosts: srv1
  become: true
  tasks:
    - copy:
        dest: /etc/ansible-lab-env
        content: "host=srv1 env=staging\n"
```

To cover **srv2** you either duplicate the play and change two strings, or you write `hosts: app` and lie — both hosts get `staging`. There is no single source of truth for “what is production”.

Same playbook, parameterized:

```yaml
- name: App marker
  hosts: app
  become: true
  tasks:
    - copy:
        dest: "{{ lab_marker_path }}"
        content: |
          host={{ inventory_hostname }}
          env={{ app_env }}
```

`inventory_hostname` is built-in (the name on the left in the inventory: `srv1`, `srv2`). `app_env` and `lab_marker_path` are **yours** — you put them in files next to the playbook.

---

## Repo layout on the stand

Ansible looks for `group_vars/` and `host_vars/` **next to the playbook** (or next to the inventory, depending on how you invoke it). In this course keep everything under `~/ansible-lab`:

```text
~/ansible-lab/
  ansible.cfg
  inventory/lab.ini
  group_vars/
    all.yml              # every host
    app.yml              # group [app] → srv1, srv2
  host_vars/
    srv1.yml             # only srv1
    web.yml              # only web (used later for nginx)
  app-marker.yml
```

The filename **must match the inventory name**, not the IP:

| File | Applies to |
|------|------------|
| `group_vars/all.yml` | `web`, `srv1`, `srv2` |
| `group_vars/app.yml` | hosts in group `[app]` |
| `host_vars/srv1.yml` | inventory host `srv1` only |
| `host_vars/172.28.0.11.yml` | **wrong** — that is not the inventory name |

---

## Source 1 — inventory (connection and groups)

You already use this in [lesson 02](02-inventory-adhoc.md):

```ini
[app]
srv1 ansible_host=172.28.0.11
srv2 ansible_host=172.28.0.12

[all:vars]
ansible_user=course
ansible_ssh_private_key_file=~/.ssh/id_lab
```

**Use inventory vars for connection:** who to SSH as, which IP, which Python. You *can* put `app_env=staging` on the `srv1` line, but after a handful of keys the INI file becomes unreadable. Move application config into `group_vars` / `host_vars`.

Group vars in INI exist too (`[app:vars]`). Same data as `group_vars/app.yml` — pick **one** place so you are not hunting two files.

---

## Source 2 — `group_vars` (the default for a tier)

```yaml
# group_vars/app.yml
app_env: production
app_port: 8080
lab_marker_path: /etc/ansible-lab-env
```

Both **srv1** and **srv2** inherit this. That is the point of a group: “app servers share a contract.”

### File vs directory

These are equivalent for group `app`:

```text
group_vars/app.yml
group_vars/app/main.yml      # any *.yml inside the folder is loaded
```

Use the **directory** form when you later add Vault ([lesson 12](12-vault-secrets.md)): plaintext `vars.yml` next to encrypted `vault.yml` in `group_vars/app/`.

`all` is a built-in group. `group_vars/all.yml` is the right place for values every machine shares (lab banner text, a common package mirror) — not for “only web” settings.

---

## Source 3 — `host_vars` (exceptions, not a dumping ground)

```yaml
# host_vars/srv1.yml
app_env: staging
node_id: 1
```

**srv2** has no `host_vars` file, so it keeps `app_env: production` from the group.

That is a real staging/prod split on a two-node lab. In production, prefer **groups** (`[app_staging]`, `[app_prod]`) over a pile of `host_vars`. Use `host_vars` for genuine snowflakes: a special `server_name`, a one-off IP in a template, a canary flag.

---

## Source 4 — play `vars:` (this playbook only)

```yaml
- name: App marker
  hosts: app
  vars:
    lab_marker_path: /tmp/lab-env   # overrides group_vars for this play
  tasks:
    - copy:
        dest: "{{ lab_marker_path }}"
        content: "{{ app_env }}\n"
```

Useful for a one-off debug play. Bad as the long-term home of `app_env` — the next playbook will not see it.

Task-level `vars:` exist too. They win over play vars for that task only. You almost never need them in this course.

---

## Source 5 — extra vars (`-e`) — highest

```bash
ansible-playbook app-marker.yml -e app_env=canary --limit srv1
```

CLI extra vars beat inventory, group, host, and play. Use them for a **temporary** override in a lab or a CI job (`-e image_tag=1.4.2`), not as the place you “store” config.

---

## Precedence (simplified, low → high)

When the same name appears twice, the **higher** source wins. You do not need the full 20-level Ansible list for this course:

```text
role defaults          (lowest — lesson 08)
    inventory / group_vars / host_vars
        play vars:
            extra vars  -e     (highest)
```

Worked merge for **srv1** with the files above:

| Variable | Value | Why |
|----------|--------|-----|
| `app_port` | `8080` | only in `group_vars/app.yml` |
| `app_env` | `staging` | `host_vars/srv1.yml` beats group `production` |
| `lab_marker_path` | `/etc/ansible-lab-env` | group, unless the play overrides it |
| `ansible_user` | `course` | `[all:vars]` in inventory |

**srv2:** same `app_port`, but `app_env` stays `production`.

---

## Jinja `{{ }}` — interpolation, not a second language yet

In YAML task arguments, `{{ app_env }}` is replaced with the string value. Quotes around a value that *starts* with `{{` keep YAML from parsing it as a nested structure:

```yaml
# Safe
content: "{{ app_env }}"

# Also fine — the key is a plain string
dest: "{{ lab_marker_path }}"
```

`when:` is **already** a Jinja expression — do not wrap the whole thing in `{{ }}` (details in [06c](06c-register-when.md)).

---

## Debug the merge before you guess

```bash
cd ~/ansible-lab
ansible-inventory --host srv1
ansible-inventory --host srv2
ansible-inventory --graph
```

`--host srv1` prints the **merged** dict Ansible will use (connection vars plus your YAML). Confirm `app_env` there before you rewrite the playbook.

Ad-hoc equivalent:

```bash
ansible srv1 -m debug -a 'var=app_env'
ansible app -m debug -a 'msg={{ inventory_hostname }} {{ app_env }}'
```

---

## What belongs where (this stand)

| Kind of data | Put it in |
|--------------|-----------|
| SSH user, key, `ansible_host` | inventory `[all:vars]` / host line |
| “All app nodes listen on 8080” | `group_vars/app.yml` |
| “srv1 is staging” | `host_vars/srv1.yml` or a staging **group** |
| “web vhost is shop.lab.local” | `host_vars/web.yml` (lesson 11) |
| One-off override in CI | `-e` |
| Passwords | **not** plaintext YAML — [Vault](12-vault-secrets.md) |

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| File named `host_vars/srv1.yaml` vs inventory `srv1` is fine; `host_vars/Srv1.yml` is not | Ansible is case-sensitive on host names |
| `group_vars/apps.yml` but inventory group is `[app]` | variables never load (`undefined`) |
| Playbook run from `~` instead of `~/ansible-lab` | Ansible does not see `group_vars/` |
| `when: app_env = staging` | syntax error / wrong operator — need `==` and quotes |
| Secrets in `group_vars/app.yml` committed to git | leak; history keeps them |

---

## In production

- Prefer **groups per environment** (`web_prod`, `app_staging`) over dozens of `host_vars`.
- Document the variable contract in the role README (names, types, defaults) — [lesson 08](08-roles.md).
- Dynamic inventory (AWS, GCP) injects host vars from tags; you still overlay `group_vars` for app config.

---

## Summary

**Variables** let one playbook describe many hosts. Put shared tier config in **`group_vars`**, exceptions in **`host_vars`**, connection data in the **inventory**, and emergencies on the **CLI**. Debug with **`ansible-inventory --host`**.

## Checklist

- [ ] Why is a copy-pasted `srv1-app.yml` / `srv2-app.yml` pair a problem after a port change?
- [ ] Where do you put a variable that every `[app]` host should share?
- [ ] What must the `host_vars` filename match?
- [ ] Who wins: `group_vars/app.yml` `app_env: production` or `host_vars/srv1.yml` `app_env: staging`?

Next: [06b. Facts: what the machine actually is](06b-facts.md).
