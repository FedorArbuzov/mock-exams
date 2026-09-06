# 21. Lab: baseline + rolling marker

## Goal

One playbook that uses **loops**, **tags**, a **block/rescue**, everyday **modules**, and **`serial: 1`**. You will watch srv1 finish before srv2, and run only the `users` slice with `--tags`.

## Prerequisites

- [16](16-lab-loops.md) — `lab_packages` / `lab_users` in `group_vars/app.yml` (re-create if you skipped)
- Theory: [17](17-tags.md), [18](18-blocks.md), [19](19-modules.md), [20](20-rolling.md)

```bash
cd ~/ansible-lab
```

This lab does **not** replace `site.yml`. Keep roles working for the [finale](22-final-project.md).

---

## Task 1. Confirm group_vars lists

`group_vars/app.yml` should contain at least:

```yaml
app_env: production
lab_packages:
  - htop
  - curl
lab_users:
  - name: deploy
    groups: sudo
    shell: /bin/bash
lab_dirs:
  - /opt/nimbus
  - /opt/nimbus/app
```

`host_vars/srv1.yml` still has `app_env: staging` from lab 07.

---

## Task 2. Playbook `app-rollout.yml`

```yaml
---
- name: App baseline rolling
  hosts: app
  become: true
  serial: 1
  max_fail_percentage: 0
  tasks:
    - name: Install lab packages
      apt:
        name: "{{ lab_packages }}"
        state: present
        update_cache: true
      tags:
        - packages

    - name: Ensure deploy user
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
      tags:
        - users

    - name: Ensure directories
      file:
        path: "{{ item }}"
        state: directory
        owner: deploy
        group: deploy
        mode: "0755"
      loop: "{{ lab_dirs }}"
      tags:
        - users

    - name: Heartbeat cron
      cron:
        name: ansible-lab heartbeat
        user: deploy
        minute: "*/15"
        job: "date >> /opt/nimbus/heartbeat.log"
        state: present
      tags:
        - cron

    - name: Rolling stamp with rescue
      block:
        - name: Write rollout stamp
          copy:
            dest: /etc/ansible-lab-rollout
            mode: "0644"
            content: |
              host={{ inventory_hostname }}
              batch_ok=true
        - name: Prove stamp is readable
          command: test -f /etc/ansible-lab-rollout
          changed_when: false
      rescue:
        - debug:
            msg: "rollout stamp failed on {{ inventory_hostname }}"
        - fail:
            msg: "Stopping remaining batches (serial + max_fail_percentage)"
      tags:
        - rollout
```

`serial: 1` is on the **play**, not on a task.

---

## Task 3. Full run — watch two recaps

```bash
ansible-playbook app-rollout.yml
```

You should see **PLAY RECAP** for **srv1** (or the first host) **before** the second host’s tasks. Both end with `/etc/ansible-lab-rollout`.

```bash
ansible app -m command -a 'cat /etc/ansible-lab-rollout'
ansible app -m command -a 'id deploy'
```

---

## Task 4. Tags

```bash
ansible-playbook app-rollout.yml --list-tags
ansible-playbook app-rollout.yml --tags users --list-tasks
ansible-playbook app-rollout.yml --tags users
```

`--tags users` must **not** run `apt` or `cron`. Recap still appears **per batch** because `serial: 1` still applies.

```bash
ansible-playbook app-rollout.yml --tags cron --limit srv1
```

Only srv1 gets (or updates) the cron entry.

---

## Task 5. Prove serial stops the fleet

Temporarily break the stamp task **only in your editor** — e.g. `dest: /proc/ansible-lab-rollout` (not writable). Run:

```bash
ansible-playbook app-rollout.yml --tags rollout
```

First host fails, rescue `fail`s, **second host must not** get a new stamp. Restore `dest: /etc/ansible-lab-rollout` and re-run.

If you used a dest that still succeeded, `command: /bin/false` inside the block instead.

---

## Success criteria

- [ ] Two PLAY RECAP blocks (one host each) on a full run  
- [ ] `deploy` exists; `/opt/nimbus/app` exists  
- [ ] `/etc/ansible-lab-rollout` on srv1 and srv2  
- [ ] `--tags users` skips apt  
- [ ] A forced failure on the first batch does not update the second host  
- [ ] Cron named `ansible-lab heartbeat` present for `deploy` (`crontab -u deploy -l` via ad-hoc `-b`)  

```bash
ansible app -b -m command -a 'crontab -u deploy -l'
```

---

## If it fails

| Symptom | Try |
|---------|-----|
| Both hosts under one task together | `serial: 1` missing on the play |
| `lab_users` undefined | `group_vars/app.yml` next to the playbook |
| `--tags users` still runs apt | apt task must not also be tagged `users` |
| cron “user deploy does not exist” | run without `--tags cron` first, or include `users` |
| `permission denied` on `/opt/nimbus` | `become: true` |
| Second host still changed after you broke the stamp | you did not `--tags rollout` only / dest still writable |

Next: [22. Final project: app tier + edge](22-final-project.md).
