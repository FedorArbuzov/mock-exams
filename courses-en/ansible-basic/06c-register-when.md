# 06c. register, when, and Jinja in tasks

## Intro: facts are the machine; register is this run

Facts ([06b](06b-facts.md)) exist before your tasks (almost). **`register`** captures the **result of one task** so a later task can branch: “did that file already exist?”, “did `nginx -t` fail?”, “what did `id deploy` print?”

Without `register` + `when`, people paste `shell:` scripts with `if [ -f ... ]` inside Ansible and lose idempotency reporting. With them, you keep modules and still express “only on first run” or “only on staging.”

## What you'll learn

- `register` structure (`rc`, `stdout`, `stat.exists`).
- `when` with variables, facts, and registered results.
- `failed_when` / `changed_when` so checks are not fake changes.
- Jinja filters you will actually type: `default`, `int`, `lower`.
- `set_fact` for a value computed mid-play.

---

## `register` — store the module result

Every module returns a JSON object. `register: marker` saves it as variable `marker` **for the rest of this play on this host**.

```yaml
- name: Stat custom marker
  stat:
    path: /etc/ansible-lab-configured
  register: marker

- debug:
    var: marker.stat.exists
```

`stat` does not create the file. `marker.stat.exists` is `true` or `false`. Other useful bits: `marker.stat.isdir`, `marker.stat.mode`.

For **command** / **shell**:

```yaml
- name: Check nginx config
  command: nginx -t
  register: nginx_test
  changed_when: false
  failed_when: false   # we will inspect rc ourselves
  become: true

- name: Show nginx -t errors
  debug:
    var: nginx_test.stderr_lines
  when: nginx_test.rc != 0
```

| Field | Typical meaning |
|-------|-----------------|
| `.rc` | exit code (`0` = success for `command`) |
| `.stdout` / `.stdout_lines` | standard output |
| `.stderr` / `.stderr_lines` | errors (`nginx -t` writes here) |
| `.changed` | whether Ansible thinks the system changed |
| `.failed` | whether the task failed |

`changed_when: false` — this task is a **check**, not a change. Without it, `command` is `changed` every run and your playbook never looks idempotent.

---

## `when` — skip a task, do not fail the play

```yaml
- name: First-run banner
  debug:
    msg: "First configuration pass on {{ inventory_hostname }}"
  when: not marker.stat.exists
```

`when` is a Jinja **expression**. Do **not** wrap the whole condition in `{{ }}`:

```yaml
# Correct
when: app_env == 'staging'

# Wrong — extra {{ }} inside when
when: "{{ app_env }} == 'staging'"
```

String compare needs **quotes** around the literal. `when: app_env == staging` looks up a variable named `staging` and is usually undefined.

### Combine vars and facts

```yaml
- name: Staging-only extra package
  apt:
    name: htop
    state: present
  when:
    - app_env == 'staging'
    - ansible_os_family == 'Debian'
```

A YAML list under `when:` means **AND**. OR is `app_env == 'staging' or app_env == 'dev'` in one expression.

### Run only on one inventory host

```yaml
when: inventory_hostname == 'srv1'
```

Prefer groups and `host_vars` over a pile of hostname `when:` clauses — but this is valid for a canary task.

---

## `failed_when` — you define failure

By default a non-zero exit fails the play. Sometimes `grep` returning `1` (no match) is OK:

```yaml
- name: See if deploy user exists
  command: id deploy
  register: deploy_id
  failed_when: false
  changed_when: false

- name: Create deploy user
  user:
    name: deploy
    state: present
  when: deploy_id.rc != 0
```

Better: use the **`user`** module alone — it is already idempotent. The snippet is here so you recognize the `id` + `register` pattern in other people’s playbooks.

---

## Jinja filters in tasks

Undefined variables **fail the play**. `default` is the escape hatch:

```yaml
- debug:
    msg: "env={{ app_env | default('unset') }}"
```

Other filters you will see:

```yaml
when: ansible_memtotal_mb | int < 256

content: "{{ app_env | lower }}\n"

dest: "/etc/{{ app_name | default('nimbus') }}/env"
```

`{{ foo | default('bar') }}` inside `copy.content` is fine. In `when:`, use `app_env | default('production') == 'staging'` without extra `{{ }}`.

---

## `set_fact` — compute once, reuse

```yaml
- name: Compose a banner string
  set_fact:
    lab_banner: "{{ inventory_hostname }} {{ app_env }} {{ ansible_default_ipv4.address }}"

- copy:
    dest: /etc/motd
    content: "{{ lab_banner }}\n"
```

`set_fact` is host-scoped for the rest of the play (and can persist with `cacheable: true` — skip that in this course). Prefer putting stable values in `group_vars` instead of computing them every run, unless they **depend on facts**.

---

## `debug` — print, do not leave it in prod with secrets

```yaml
- debug:
    msg: "{{ inventory_hostname }} → {{ app_env }}"

- debug:
    var: marker   # dumps the whole registered object
```

Never `debug: var=db_password`. Vault lesson covers `no_log: true`.

---

## Mini playbook that ties 06 + 06b + 06c

```yaml
---
- name: App tier marker with facts
  hosts: app
  become: true
  tasks:
    - name: Stat marker
      stat:
        path: "{{ lab_marker_path }}"
      register: marker

    - name: Write marker
      copy:
        dest: "{{ lab_marker_path }}"
        mode: "0644"
        content: |
          host={{ inventory_hostname }}
          env={{ app_env }}
          ip={{ ansible_default_ipv4.address }}
          os={{ ansible_distribution }}
          first_run={{ not marker.stat.exists }}

    - name: Warn on staging
      debug:
        msg: "Staging host {{ inventory_hostname }} — do not point customers here"
      when: app_env == 'staging'
```

After [lab 07](07-lab-variables.md) you will have `lab_marker_path` and `app_env` defined. `first_run` is `True` only when the file was missing **before** this `copy` (stat ran first).

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `when: app_env = 'staging'` | invalid / assignment — use `==` |
| `when: "{{ marker.stat.exists }}"` | extra Jinja; use `when: marker.stat.exists` |
| Forgetting `changed_when: false` on `command: nginx -t` | every run is `changed` |
| Registering then using the var on a **different** host | registers are per host |
| `when: app_env == staging` (no quotes) | looks up variable `staging` |

---

## In production

- Prefer modules (`user`, `file`, `stat`) over `command` + `register` + `when`.
- Use `block` / `rescue` for real error handling — [lesson 18](18-blocks.md).
- `--step` and `-v` show skipped tasks (`skipping: [srv2]`) so you can confirm `when` logic.

---

## Summary

**`register`** snapshots a task result. **`when`** skips work using vars, facts, or that snapshot. **`changed_when` / `failed_when`** keep checks from looking like changes. Together with [variables](06-variables-facts.md) and [facts](06b-facts.md) you can write one playbook for srv1 (staging) and srv2 (production).

## Checklist

- [ ] What is the difference between a fact and a registered variable?
- [ ] Why does `command: nginx -t` need `changed_when: false`?
- [ ] Write a `when` that is true only if `app_env` is `staging`.
- [ ] Where do `group_vars` files live relative to the playbook?

Next lab: [07. Lab: group_vars, host_vars, and facts](07-lab-variables.md).
