# 16. Lab: packages and users in a loop

## Goal

Drive two app hosts from **lists in `group_vars`**: install a package list with one `apt` task, create users from a list of dicts with `loop`, and prove a second run is idle.

## Why this matters

The [finale](22-final-project.md) needs user `deploy` and a directory tree. Doing that with one task per path does not scale. After this lab you will add items by editing YAML, not by cloning tasks.

## Prerequisites

- [07](07-lab-variables.md) — `group_vars/app.yml` exists
- Theory: [15](15-loops.md)
- `cd ~/ansible-lab` on **lab**

---

## Task 1. Lists in `group_vars/app.yml`

Add (keep `app_env` / `app_port` if they are already there):

```yaml
lab_packages:
  - htop
  - curl
  - ca-certificates

lab_users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
  - name: auditor
    groups: ""
    shell: /usr/sbin/nologin

lab_dirs:
  - /opt/nimbus
  - /opt/nimbus/app
```

Empty `groups: ""` means “no extra group” for `auditor`. `deploy` is the finale account — creating it early is fine.

---

## Task 2. Playbook `app-loop.yml`

```yaml
---
- name: App lists
  hosts: app
  become: true
  tasks:
    - name: Install lab packages
      apt:
        name: "{{ lab_packages }}"
        state: present
        update_cache: true

    - name: Ensure lab users
      user:
        name: "{{ item.name }}"
        groups: "{{ item.groups }}"
        append: true
        shell: "{{ item.shell }}"
        create_home: true
        state: present
      loop: "{{ lab_users }}"
      loop_control:
        label: "{{ item.name }}"

    - name: Ensure lab directories
      file:
        path: "{{ item }}"
        state: directory
        owner: deploy
        group: deploy
        mode: "0755"
      loop: "{{ lab_dirs }}"
```

---

## Task 3. Run twice

```bash
ansible-playbook app-loop.yml
ansible-playbook app-loop.yml
```

First run: `changed` on packages/users/dirs (if they were missing). Second: `changed=0` on those tasks.

```bash
ansible app -m command -a 'id deploy'
ansible app -m command -a 'id auditor'
ansible app -m command -a 'ls -ld /opt/nimbus/app'
ansible srv1 -b -m command -a 'htop --version' | head -1
```

Both hosts should show `deploy` and `auditor`. `htop` exists (you may need `-b` depending on PATH).

---

## Task 4. Per-item skip

Add a third directory that should exist **only on staging**:

```yaml
# in the playbook, extra task
    - name: Staging-only canary dir
      file:
        path: /opt/nimbus/canary
        state: directory
        owner: deploy
        mode: "0755"
      when: app_env == 'staging'
```

`app_env` is `staging` on srv1 ([lab 07](07-lab-variables.md)) and `production` on srv2.

```bash
ansible-playbook app-loop.yml
ansible app -m command -a 'ls -d /opt/nimbus/canary'
```

Expect the path on **srv1** and a failure / absent on **srv2**.

---

## Task 5. See the broken `loop` (optional, 30 s)

Temporarily change the package task to:

```yaml
      apt:
        name: "{{ item }}"
        state: present
      loop: lab_packages    # broken on purpose
```

Run once — you should get a nonsense item or a failure. Restore `name: "{{ lab_packages }}"` without that `loop`.

---

## Success criteria

- [ ] `htop` and `curl` present on srv1 and srv2  
- [ ] users `deploy` and `auditor` exist on both app hosts  
- [ ] `/opt/nimbus/app` owned by `deploy`  
- [ ] `/opt/nimbus/canary` only on srv1  
- [ ] second `ansible-playbook app-loop.yml` is idempotent  

---

## If it fails

| Symptom | Try |
|---------|-----|
| `lab_packages` undefined | you are not in `~/ansible-lab` or the key is not under `group_vars/app.yml` |
| `item` is the string `lab_packages` | you wrote `loop: lab_packages` without `{{ }}` |
| `auditor` has group `sudo` | `groups: ""` and do not `append` leftover groups from a previous run — or `groups: []` |
| `user` permission denied | `become: true` on the play |
| canary on both hosts | `host_vars/srv1.yml` must set `app_env: staging`; srv2 must not |

Next: [17. Tags: run part of a playbook](17-tags.md).
