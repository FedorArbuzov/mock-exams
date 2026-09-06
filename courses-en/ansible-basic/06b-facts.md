# 06b. Facts: what the machine actually is

## Intro: you cannot hard-code the OS or the IP

Variables in [lesson 06](06-variables-facts.md) are values **you** chose: `app_env`, `app_port`. **Facts** are values Ansible **discovers** by probing the host: Ubuntu vs Debian, how much RAM, which IPv4 is on `eth0`.

A typical incident: the playbook always installs with `apt`. A colleague adds a Rocky Linux box to `[app]`. Every task fails. The fix is not a second playbook — it is “read `ansible_os_family` and pick the package module.” On our stand every node is Ubuntu, so facts still matter for **IPs, CPU, memory, and hostnames** you should not type by hand.

## What you'll learn

- How fact gathering works (`setup`, `gather_facts`).
- Useful facts on `lab` / `srv1` / `web`.
- Real tasks: MOTD, nginx workers, memory guard, package family.
- `inventory_hostname` vs `ansible_hostname` vs `ansible_fqdn`.
- When to turn facts **off** (speed).

---

## What a fact is

On playbook start (unless you disable it), Ansible runs the **`setup`** module on each host and stores the result in **`ansible_facts`**. Magic shortcuts like `ansible_distribution` are the same data.

```text
you set          Ansible discovers
────────         ─────────────────
app_env          ansible_distribution = Ubuntu
app_port         ansible_default_ipv4.address = 172.28.0.11
nginx_server_name ansible_processor_vcpus = 2
                 ansible_memtotal_mb = 1967
```

Facts describe **reality on that SSH target**, not the control node. Running a play from `lab` still fills facts for `srv1` with **srv1’s** OS and IP.

---

## Dump facts (ad-hoc)

From `~/ansible-lab` on **lab**:

```bash
ansible srv1 -m setup
ansible srv1 -m setup -a 'filter=ansible_distribution*'
ansible srv1 -m setup -a 'filter=ansible_default_ipv4'
ansible srv1 -m setup -a 'filter=ansible_memory*'
ansible srv1 -m setup -a 'filter=ansible_processor*'
```

`filter=` is a glob. Without it the dump is huge — that is normal.

Playbook equivalent:

```yaml
- name: Inspect one host
  hosts: srv1
  gather_facts: true
  tasks:
    - debug:
        var: ansible_facts.distribution
    - debug:
        msg: "{{ ansible_distribution }} {{ ansible_distribution_version }}"
```

Both `ansible_facts['distribution']` and `ansible_distribution` work. This course uses the short `ansible_*` names.

---

## Facts you will actually use

Values below are **typical** for the Docker Linux stand — your RAM/CPU numbers will differ. IPs should match [ENVIRONMENT.md](ENVIRONMENT.md).

| Fact | Meaning | Example on srv1 |
|------|---------|-----------------|
| `ansible_distribution` | OS family brand | `Ubuntu` |
| `ansible_distribution_version` | Version | `24.04` |
| `ansible_os_family` | Broad family | `Debian` (apt world) |
| `ansible_pkg_mgr` | Package manager | `apt` |
| `ansible_default_ipv4.address` | Primary IPv4 | `172.28.0.11` |
| `ansible_hostname` | Kernel hostname | `srv1` |
| `ansible_fqdn` | FQDN if configured | often `srv1` in the lab |
| `ansible_memtotal_mb` | RAM in MiB | depends on Docker |
| `ansible_processor_vcpus` | CPU count | depends on Docker |
| `ansible_system` | Kernel name | `Linux` |

`inventory_hostname` is **not** a fact from `setup`. It is the name in your inventory (`srv1`). It can differ from `ansible_hostname` if someone renamed the machine and forgot to update inventory.

---

## Real use 1 — MOTD / marker with discovered identity

You should not type `172.28.0.11` into a file that is supposed to work on srv2 as well:

```yaml
- name: Lab identity file
  copy:
    dest: /etc/ansible-lab-identity
    content: |
      inventory={{ inventory_hostname }}
      hostname={{ ansible_hostname }}
      ip={{ ansible_default_ipv4.address }}
      os={{ ansible_distribution }} {{ ansible_distribution_version }}
```

On **srv1** you get `.11` and Ubuntu; on **web** you get `.20`. Same task, different files. That is the whole idea.

---

## Real use 2 — nginx `worker_processes` from CPU

A common production pattern: size workers from the machine, not from a guess in git.

```yaml
# roles/nginx/defaults/main.yml  (preview of lesson 08)
nginx_workers: "{{ ansible_processor_vcpus }}"
```

```nginx
# templates/nginx.conf.j2  (lesson 10)
worker_processes {{ nginx_workers }};
```

On a 2-vCPU container nginx gets 2 workers; on a 8-vCPU VM it gets 8 — without a per-host YAML file.

If you need a cap: `{{ [ansible_processor_vcpus, 8] | min }}`.

---

## Real use 3 — refuse to install on a tiny host

```yaml
- name: Require at least 256 MB RAM
  fail:
    msg: "{{ inventory_hostname }} has {{ ansible_memtotal_mb }} MB — too small for this role"
  when: ansible_memtotal_mb | int < 256
```

`fail` stops the play for that host. Useful as a guard before compiling or starting a JVM. On the lab this should **pass**; change `256` to `99999` once to see the message, then revert.

---

## Real use 4 — package module from OS family

Our stand is all Ubuntu, but write the branch so the playbook is honest:

```yaml
- name: Install nginx (Debian family)
  apt:
    name: nginx
    state: present
    update_cache: true
  when: ansible_os_family == "Debian"

- name: Install nginx (RedHat family)
  yum:
    name: nginx
    state: present
  when: ansible_os_family == "RedHat"
```

Shorter form on modern Ansible: the **`package`** module delegates to `ansible_pkg_mgr`. Still gather facts first.

```yaml
- package:
    name: nginx
    state: present
```

Do not copy-paste `when: ansible_os_family == Debian` without quotes — `Debian` must be a **string**.

---

## Real use 5 — listen address in a config

Binding a service to “whatever IP this host has” without putting IPs in `host_vars`:

```yaml
# group_vars/app.yml
app_bind: "{{ ansible_default_ipv4.address }}"
app_port: 8080
```

A systemd unit or python `http.server` can use `{{ app_bind }}:{{ app_port }}`. **Caveat:** `ansible_default_ipv4` is a nested dict. If a host has no IPv4 default route, the fact is missing and the play fails — then you set `app_bind: 0.0.0.0` in group_vars instead.

On this Docker stand, default IPv4 is the `172.28.0.0/24` address. Good enough for labs.

---

## `gather_facts: false` — when and why

Fact gathering is an extra SSH round-trip and a Python probe. For a 3-host lab it is instant. For 500 hosts it is noticeable.

```yaml
- name: Only restart a service
  hosts: app
  gather_facts: false
  become: true
  tasks:
    - systemd:
        name: nimbus-app
        state: restarted
```

If you then use `{{ ansible_distribution }}` in that play, the task **fails** (`ansible_distribution is undefined`). Either gather facts, or do not use facts.

You can gather later in the play:

```yaml
- setup:
  when: ansible_distribution is not defined
```

---

## inventory name vs OS hostname

| Name | Source | Use for |
|------|--------|---------|
| `inventory_hostname` | inventory left-hand name | logs, `host_vars` filename, “which host did Ansible mean” |
| `ansible_hostname` | `hostname` on the box | MOTD, cert CN if it matches DNS |
| `ansible_fqdn` | FQDN from facts | emails, nginx `server_name` **if** DNS is real |
| `ansible_host` | connection IP/DNS | SSH only; not for human-facing names |

On the stand, keep nginx `server_name` as a **variable** (`shop.lab.local` in `host_vars/web.yml`), not `ansible_fqdn`. The lab containers often have short hostnames and no public DNS.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `gather_facts: false` then `{{ ansible_default_ipv4.address }}` | undefined variable |
| `{{ ansible_default_ipv4 }}` in a string that expected an IP | you interpolated a whole dict |
| Assuming `ansible_hostname` equals inventory name | rename the VM, inventory stays `srv1` |
| Filtering facts with the wrong glob | empty `ansible_facts` in the dump — try `ansible_*` |
| Using facts from **lab** (control node) in a play for `web` | facts are per **target** host |

---

## In production

- Custom facts (`/etc/ansible/facts.d/*.fact`) expose app version or rack location — optional later.
- `setup` caches can go stale in long plays; re-run `setup` after changing network config.
- Do not treat facts as secrets; they show up in `-v` logs (IPs, usernames, hardware).

---

## Summary

**Facts** are a live inventory of each host. Use them for OS-specific tasks, bind addresses, and sizing. **Variables** remain the place for *intent* (`staging` vs `production`). Combine both in the next lesson.

## Checklist

- [ ] Which module fills `ansible_facts`?
- [ ] Which fact is a reasonable source for “this host’s IPv4”?
- [ ] Why might `inventory_hostname` and `ansible_hostname` differ?
- [ ] What breaks if you set `gather_facts: false` but still reference `ansible_distribution`?

Next: [06c. register, when, and Jinja in tasks](06c-register-when.md).
