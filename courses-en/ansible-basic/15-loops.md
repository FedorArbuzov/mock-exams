# 15. Loops: one task, many items

## Intro: eight `apt` tasks is a code smell

You need `htop`, `curl`, `ca-certificates`, and `rsync` on every app host. Four copy-pasted `apt:` tasks work — until someone adds `jq` in one playbook and forgets the other. A **loop** is the same module, many values:

```yaml
- name: Install lab packages
  apt:
    name: "{{ item }}"
    state: present
  loop:
    - htop
    - curl
    - ca-certificates
    - rsync
```

Better still: pass a **list** to `apt` (`name: "{{ lab_packages }}"`) — the apt module is list-aware and one transaction. Loops still matter for **users**, **directories**, **cron rows**, and **dict** items that are not a single module argument.

## What you'll learn

- `loop` (current) vs `with_items` (old).
- Looping lists, dicts, and lists of dicts.
- `loop_control.label` so logs stay readable.
- `loop` + `when`, and `loop` over a variable from `group_vars`.
- When **not** to loop (batch APIs, `with_fileglob` rabbit holes).

---

## `loop` is the default

```yaml
- name: Ensure deploy directories
  file:
    path: "{{ item }}"
    state: directory
    owner: deploy
    group: deploy
    mode: "0755"
  loop:
    - /opt/nimbus
    - /opt/nimbus/app
    - /var/log/nimbus
```

On **srv1** Ansible prints one result per item. Second run: all `ok`.

`with_items` still works and is the same idea. New playbooks use **`loop`**. Filters that used to be `with_fileglob` / `with_together` are now `loop: "{{ query('fileglob', ...) }}"` — you do not need those in this course.

---

## Loop a variable, not a literal list

```yaml
# group_vars/app.yml
lab_packages:
  - htop
  - curl
  - ca-certificates
```

```yaml
- name: Install lab packages
  apt:
    name: "{{ lab_packages }}"
    state: present
    update_cache: true
```

No `loop` here — `apt` accepts a list. Use `loop` when **each item is a different resource**:

```yaml
# group_vars/app.yml
lab_users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
  - name: auditor
    groups: ""
    shell: /usr/sbin/nologin
```

```yaml
- name: Ensure lab users
  user:
    name: "{{ item.name }}"
    groups: "{{ item.groups }}"
    append: true
    shell: "{{ item.shell }}"
    state: present
    create_home: true
  loop: "{{ lab_users }}"
```

`item` is the current dict. `item.name` is `deploy`, then `auditor`.

---

## `loop_control` — readable logs

A loop over long dicts dumps the whole structure in the recap. Label the item:

```yaml
- name: Ensure lab users
  user:
    name: "{{ item.name }}"
    state: present
  loop: "{{ lab_users }}"
  loop_control:
    label: "{{ item.name }}"
```

Output becomes `Ensure lab users (deploy)` instead of a YAML blob.

`loop_var: u` if you nest loops (outer `item` would clash). On this stand one loop is enough.

---

## `loop` + `when`

`when` is evaluated **per item**:

```yaml
- name: Staging-only debug packages
  apt:
    name: "{{ item }}"
    state: present
  loop:
    - strace
    - tcpdump
  when: app_env == 'staging'
```

On **srv2** (`production`) the whole task is skipped. On **srv1** both packages install.

Skip individual items:

```yaml
- name: Create optional paths
  file:
    path: "{{ item.path }}"
    state: directory
  loop:
    - { path: /opt/nimbus, create: true }
    - { path: /opt/nimbus/canary, create: false }
  when: item.create
```

---

## Register + loop (read the results)

```yaml
- name: Stat marker files
  stat:
    path: "{{ item }}"
  loop:
    - /etc/ansible-lab-env
    - /etc/nimbus-configured
  register: markers

- debug:
    msg: "{{ item.item }} exists={{ item.stat.exists }}"
  loop: "{{ markers.results }}"
  loop_control:
    label: "{{ item.item }}"
```

A registered loop is a list under **`.results`**, not a single `.stat`. Forgetting that is the usual bug.

---

## Until / retries — not a data loop

```yaml
- name: Wait until app port is open
  wait_for:
    host: "{{ ansible_default_ipv4.address }}"
    port: "{{ app_port | default(8080) }}"
    delay: 1
    timeout: 15
  register: port_up
  until: port_up is succeeded
  retries: 5
  delay: 2
```

`until` repeats **the same task** until a condition. Different from `loop` over a list. Useful after `systemd: started` for the finale app.

---

## YAML inventory (same data, different syntax)

INI is what you used in [lesson 02](02-inventory-adhoc.md). The same hosts as YAML:

```yaml
# inventory/lab.yml
all:
  vars:
    ansible_user: course
    ansible_ssh_private_key_file: ~/.ssh/id_lab
    ansible_python_interpreter: /usr/bin/python3
  children:
    web:
      hosts:
        web:
          ansible_host: 172.28.0.20
    app:
      hosts:
        srv1:
          ansible_host: 172.28.0.11
        srv2:
          ansible_host: 172.28.0.12
```

Point `ansible.cfg` at `inventory/lab.yml` **or** keep INI. Do not maintain both. Lists of packages still belong in `group_vars`, not in inventory.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `loop: lab_packages` (no `{{ }}`) | loops the **string** `lab_packages` (one fake item) |
| `name: "{{ item }}"` plus `loop` on a module that already took a list | double-loop / wrong type |
| Huge `with_fileglob` of templates | unreadable; prefer an explicit list in vars |
| Reading `markers.stat` after a looped `stat` | attribute missing — use `markers.results` |
| Nested `loop` both using `item` | inner overwrites outer — set `loop_var` |

---

## In production

- Lists in `group_vars` (or role defaults) are the API; the task stays one line.
- Prefer native list args (`apt`, `yum`, `package`) over looping the same module 40 times — faster, one cache update.
- `ansible-playbook --syntax-check` does not prove your loop data is a list.

---

## Summary

**`loop`** repeats a task over a list (or list of dicts). Put the list in **`group_vars`**. Use **`loop_control.label`** for logs. Use **`until`** for retries, not for “for each package.”

## Checklist

- [ ] When do you loop `apt`, and when do you pass a list to `name:`?
- [ ] What is `item.name` if `item` is `{ name: deploy, shell: /bin/bash }`?
- [ ] Why does a looped `register` need `.results`?
- [ ] What is wrong with `loop: lab_packages` (no braces)?

Next lab: [16. Lab: packages and users in a loop](16-lab-loops.md).
