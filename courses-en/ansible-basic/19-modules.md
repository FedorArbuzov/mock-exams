# 19. Everyday modules

## Intro: `shell` is not a module catalog

Most of what you do on a Linux box is already a module: create a user, a directory, a cron line, an SSH key, unpack a tarball. `shell: useradd && mkdir && crontab` has no change reporting and fights [idempotency](04-playbooks.md).

This lesson is a **map** of modules you will use on the stand and at work — not every Ansible module (there are thousands). Prefer `ansible-doc user` when you forget a parameter.

## What you'll learn

- `user` / `group` / `file` / `copy` vs `unarchive`.
- `authorized_key` (how you should have copied `id_lab` in production).
- `cron` for a lab heartbeat.
- `lineinfile` vs a template.
- Why `ufw` is awkward in this Docker stand.
- FQCN (`ansible.builtin.user`) as the name you will see in collections.

Hands-on mix: [lab 21](21-lab-rollout.md).

---

## Users and groups

```yaml
- name: App group
  group:
    name: nimbus
    state: present

- name: Deploy user
  user:
    name: deploy
    group: nimbus
    groups: sudo
    append: true
    shell: /bin/bash
    create_home: true
    state: present
```

`append: true` adds `sudo` without wiping other groups. `state: absent` + `remove: true` deletes the home — do not put that in `site.yml`.

`password:` expects a **hash**, not plaintext. Use `password: "{{ vault_deploy_hash }}"` or skip and keep SSH keys only (this course).

---

## Files and directories

```yaml
- name: App tree
  file:
    path: "{{ item }}"
    state: directory
    owner: deploy
    group: nimbus
    mode: "0755"
  loop:
    - /opt/nimbus
    - /opt/nimbus/app

- name: Secret file mode
  file:
    path: /etc/nimbus/db.env
    owner: root
    group: deploy
    mode: "0640"
    state: file
```

`state: link` / `absent` you already used for nginx sites. `state: touch` creates an empty file.

`copy` for a file that lives next to the role (`src: favicon.ico` → `roles/app/files/favicon.ico`). `content:` for short generated text. `template` for Jinja ([10](10-templates-handlers.md)).

---

## `unarchive` — drop a release tarball

```yaml
- name: Unpack app release
  unarchive:
    src: nimbus-app-1.0.tar.gz
    dest: /opt/nimbus/app
    remote_src: false
    owner: deploy
    extra_opts: [--strip-components=1]
```

`remote_src: false` (default): the tarball is on **lab**, Ansible pushes it. `remote_src: true`: already on the target (e.g. after `get_url`).

```yaml
- name: Fetch a public tarball
  get_url:
    url: https://example.invalid/app.tgz
    dest: /tmp/app.tgz
    mode: "0644"
```

The lab network may not reach the internet. Prefer a tarball you `copy` from `roles/app/files/` or skip `get_url` here.

---

## `authorized_key` — SSH access the Ansible way

```yaml
- name: Allow lab pubkey for deploy
  authorized_key:
    user: deploy
    state: present
    key: "{{ lookup('file', lookup('env', 'HOME') + '/.ssh/id_lab.pub') }}"
```

`lookup('file', ...)` reads on the **control node** (`lab`). That is how you would have provisioned `course@srv1` without `ssh-copy-id` in a loop.

Do **not** put a private key in a role `files/` directory.

---

## `cron`

systemd timers are nicer in production; cron is everywhere and exists on the stand.

```yaml
- name: Heartbeat stamp
  cron:
    name: ansible-lab heartbeat
    user: deploy
    minute: "*/15"
    job: "date >> /opt/nimbus/heartbeat.log"
    state: present
```

`name:` is Ansible’s id for the line (comment in crontab). Change `job:` and re-run — it updates that named entry instead of appending forever (`lineinfile` on crontab does that).

---

## `lineinfile` — last resort

```yaml
- name: sysctl snippet
  lineinfile:
    path: /etc/sysctl.d/99-nimbus.conf
    line: "net.ipv4.ip_forward = 0"
    create: true
    mode: "0644"
```

Fine for **one** line. Five related lines → `blockinfile` or a **template**. Editing `nginx.conf` with `lineinfile` is how vhosts rot.

---

## Firewall on this stand

Ubuntu images may have **`ufw`** or only **nftables**. In Docker, UFW often does **not** match “real datacenter UFW”: published ports and `DOCKER-USER` chains get confusing.

```yaml
- name: Allow SSH (if ufw is installed)
  ufw:
    rule: allow
    port: "22"
    proto: tcp
  when: ansible_facts.packages['ufw'] is defined
```

`ansible_facts.packages` needs `gather_facts` and the package fact plugin — or just `command: which ufw` + `when`. For this course, **do not** rely on UFW for the finale. If you want a guard, write a file `/etc/nimbus/firewall-note` rather than locking yourself out of SSH.

---

## FQCN — names you will see in 2.10+

```yaml
- name: Deploy user
  ansible.builtin.user:
    name: deploy
    state: present
```

`ansible.builtin` is the collection shipped with Ansible. Short names (`user`) still work. Collections from Galaxy (`community.general.ufw`) need `ansible-galaxy collection install`. This course stays on **builtin** modules so the lab image does not need extra collections.

---

## Quick map

| Job | Module |
|-----|--------|
| Package | `apt` / `package` |
| Service | `systemd` |
| User / group | `user`, `group` |
| Path / mode / symlink | `file` |
| Static file | `copy` |
| Jinja file | `template` |
| Tarball | `unarchive` |
| HTTP get | `get_url` / `uri` |
| SSH pubkey | `authorized_key` |
| Crontab | `cron` |
| One line in a file | `lineinfile` |
| Wait for port | `wait_for` |

`ansible-doc systemd` / `ansible-doc -l | less` on `lab`.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `user: password: hunter2` | not a hash; login will not work as you think |
| Private key in `files/` | leak |
| `lineinfile` on a full nginx config | drift, duplicate lines |
| `unarchive` every run with a new temp name | always `changed` |
| Enabling UFW deny-incoming in Docker | can break SSH / published ports |

---

## In production

- Pin package versions when policy requires it (`apt: name=nginx=1.24.*`).
- `authorized_key` + a user role is the usual “bootstrap after Terraform.”
- Prefer systemd timers over cron for new services.

---

## Summary

Use a **module per resource type**. Lists + [loops](15-loops.md) build a baseline role without `shell`. Next: change **how many hosts at once** (`serial`).

## Checklist

- [ ] Which module creates `/opt/nimbus` with owner `deploy`?
- [ ] Why must `user.password` be a hash?
- [ ] Where does `lookup('file', ...)` read from?
- [ ] When is `lineinfile` the wrong tool?

Next: [20. Rolling updates](20-rolling.md).
