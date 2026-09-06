# 07. Lab: group_vars, host_vars, and facts

## Goal

Parameterize the app tier: **`group_vars/app.yml`** for shared settings, **`host_vars/srv1.yml`** so staging differs from production, a marker file that also records **facts** (IP, OS), and a proof that **`-e` extra vars** win.

## Why this matters

Without these files, every playbook hard-codes `staging` / `production` and IPs. After this lab you can read `ansible-inventory --host srv1` and **predict** the marker before you open the file on the host.

## Prerequisites

- [05-lab-playbook.md](05-lab-playbook.md) completed (`ansible web -m ping` still works)
- Theory: [06](06-variables-facts.md), [06b](06b-facts.md), [06c](06c-register-when.md)

Work on **`lab`** in `~/ansible-lab` (same inventory as lesson 03).

---

## Task 1. Variable files

```bash
mkdir -p ~/ansible-lab/group_vars ~/ansible-lab/host_vars
cd ~/ansible-lab
```

`group_vars/app.yml`:

```yaml
app_env: production
app_port: 8080
lab_marker_path: /etc/ansible-lab-env
```

`host_vars/srv1.yml`:

```yaml
app_env: staging
```

Do **not** create `host_vars/srv2.yml`. srv2 must inherit `production` from the group.

Starters: [examples/group_vars/app.yml](examples/group_vars/app.yml), [examples/host_vars/srv1.yml](examples/host_vars/srv1.yml).

---

## Task 2. Playbook `app-marker.yml`

```yaml
---
- name: App tier marker
  hosts: app
  become: true
  tasks:
    - name: Stat existing marker
      stat:
        path: "{{ lab_marker_path }}"
      register: marker

    - name: Write env marker
      copy:
        dest: "{{ lab_marker_path }}"
        mode: "0644"
        content: |
          host={{ inventory_hostname }}
          env={{ app_env }}
          port={{ app_port }}
          ip={{ ansible_default_ipv4.address }}
          os={{ ansible_distribution }} {{ ansible_distribution_version }}
          first_write={{ not marker.stat.exists }}

    - name: Show merged vars
      debug:
        msg: "{{ inventory_hostname }} env={{ app_env }} ip={{ ansible_default_ipv4.address }}"

    - name: Staging reminder
      debug:
        msg: "srv1 is staging — group default was production"
      when: app_env == 'staging'
```

`gather_facts` stays at the default (`true`) so `ansible_default_ipv4` and `ansible_distribution` exist.

---

## Task 3. Run and inspect the files

```bash
ansible-playbook app-marker.yml
ansible app -m command -a 'cat /etc/ansible-lab-env'
```

**Expected:**

| Host | `env=` | `ip=` (typical) | Staging debug task |
|------|--------|-----------------|--------------------|
| **srv1** | `staging` | `172.28.0.11` | runs |
| **srv2** | `production` | `172.28.0.12` | skipped |

Second run: `first_write=False` (file already existed when `stat` ran). `copy` may still be `ok` if content is identical.

---

## Task 4. Inspect the merge (do this even if cat looked fine)

```bash
ansible-inventory --host srv1
ansible-inventory --host srv2
ansible-inventory --graph
```

In the JSON for srv1 you should see **both** `app_env: staging` and `app_port: 8080` (port only defined in group_vars). srv2: `app_env: production`.

```bash
ansible srv1 -m setup -a 'filter=ansible_default_ipv4'
```

Confirm the address matches the `ip=` line in the marker.

---

## Task 5. Extra vars beat host_vars

```bash
ansible-playbook app-marker.yml -e app_env=canary --limit srv1
ansible srv1 -m command -a 'cat /etc/ansible-lab-env'
```

Expect `env=canary` on srv1 only. Restore the lab:

```bash
ansible-playbook app-marker.yml --limit srv1
```

(`host_vars` returns `staging` once `-e` is gone.)

---

## Success criteria

- [ ] Marker exists on srv1 and srv2  
- [ ] srv1 `env=staging`, srv2 `env=production`  
- [ ] Marker includes a real IPv4 and `Ubuntu` (facts, not hard-coded)  
- [ ] `ansible-inventory --host srv1` shows group + host vars  
- [ ] `-e app_env=canary` changed srv1 until you re-ran without `-e`  
- [ ] Staging `debug` ran on srv1 and was skipped on srv2  

---

## If it fails

| Symptom | Try |
|---------|-----|
| Same `env` on both hosts | Filename must be `host_vars/srv1.yml` (inventory name `srv1`, not the IP) |
| `lab_marker_path` undefined | File must be `group_vars/app.yml` — group name is `app`, not `apps` |
| `ansible_default_ipv4` undefined | Do not set `gather_facts: false`; run from `~/ansible-lab` |
| Variable missing in `--host` output | `group_vars/` must sit next to the playbook you run |
| `when: app_env == staging` error | Quote the string: `'staging'` |
| Playbook not found | `cd ~/ansible-lab` |

Next: [08. Roles: stop copy-pasting playbooks](08-roles.md).
