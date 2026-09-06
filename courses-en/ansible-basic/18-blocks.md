# 18. block, rescue, always

## Intro: `ignore_errors: true` hides the fire

A playbook templates nginx, runs `nginx -t`, then reloads. If `-t` fails, you want to **leave the old file** and print a useful error — not abort halfway with a 20-line Python traceback, and not `ignore_errors` so the reload still runs on a broken config.

A **`block`** groups tasks that share `when`, `become`, `rescue`, and `always`. **`rescue`** runs if anything in the block failed. **`always`** runs either way (like `finally`).

## What you'll learn

- `block` as a grouping tool (`become` / `when` once).
- `rescue` for recovery and clearer failures.
- `always` for cleanup.
- When to use `failed_when` vs a whole rescue path.

---

## Block as a “with these settings”

```yaml
- name: Privileged web files
  become: true
  when: ansible_os_family == "Debian"
  block:
    - name: Deploy vhost
      template:
        src: ansible-lab.conf.j2
        dest: /etc/nginx/sites-available/ansible-lab.conf
        mode: "0644"
    - name: Enable site
      file:
        src: /etc/nginx/sites-available/ansible-lab.conf
        dest: /etc/nginx/sites-enabled/ansible-lab.conf
        state: link
```

Same as putting `become` / `when` on each task. Worth it when the list is long. Tags on the `block` apply to the inner tasks (import-like).

---

## Rescue — recover or fail loudly

```yaml
- name: Safe nginx test
  block:
    - name: Validate nginx
      command: nginx -t
      changed_when: false
  rescue:
    - name: Show why nginx -t failed
      debug:
        msg: "nginx config is invalid on {{ inventory_hostname }} — not reloading"
    - name: Fail the play on purpose
      fail:
        msg: "Fix the vhost template, then re-run"
```

If `nginx -t` succeeds, `rescue` is skipped. If it fails, Ansible does **not** stop at the command error — it enters `rescue`. The `fail` task then marks the host failed **after** your debug line.

Without `fail` in rescue, a rescued block is treated as **handled** — later tasks in the play still run. That surprises people: “it failed but the play continued.” Put `fail:` at the end of rescue when the host must stop.

---

## Always — cleanup

```yaml
- name: Scratch file experiment
  block:
    - name: Write scratch
      copy:
        dest: /tmp/ansible-lab-scratch
        content: "work\n"
    - name: Intentional fail
      command: /bin/false
  rescue:
    - debug:
        msg: "scratch path failed on {{ inventory_hostname }}"
  always:
    - name: Remove scratch
      file:
        path: /tmp/ansible-lab-scratch
        state: absent
```

`always` runs after success **or** rescue. Use it for temp files, `umount`, or dropping a lock. Do not put the only copy of “reload nginx” in `always` — you would reload even after a failed `nginx -t`.

---

## Mini pattern: backup, template, test, restore

```yaml
- name: Deploy vhost with rollback
  become: true
  block:
    - name: Backup existing vhost
      copy:
        src: /etc/nginx/sites-available/ansible-lab.conf
        dest: /etc/nginx/sites-available/ansible-lab.conf.bak
        remote_src: true
      ignore_errors: true   # first run: file may not exist

    - name: Deploy vhost
      template:
        src: ansible-lab.conf.j2
        dest: /etc/nginx/sites-available/ansible-lab.conf
        mode: "0644"

    - name: Validate nginx
      command: nginx -t
      changed_when: false
  rescue:
    - name: Restore backup
      copy:
        src: /etc/nginx/sites-available/ansible-lab.conf.bak
        dest: /etc/nginx/sites-available/ansible-lab.conf
        remote_src: true
    - fail:
        msg: "nginx -t failed; backup restored on {{ inventory_hostname }}"
```

First apply: skip restore if there is no `.bak`. After a bad template edit, rescue puts the last good file back.

`remote_src: true` means “src is on the **target**,” not on `lab`.

---

## `ignore_errors` vs rescue

| Tool | Use |
|------|-----|
| `failed_when: false` | this task’s exit code is not a failure (e.g. `id deploy` while checking) |
| `ignore_errors: true` | failure is OK **and** you will not handle it — easy to hide bugs |
| `block` / `rescue` | failure is expected sometimes; you have a recovery path |
| `any_errors_fatal: true` (play) | one host fails → abort the whole play ([20](20-rolling.md)) |

Prefer modules that cannot fail (`user: state=present`) over `command` + rescue.

---

## Rescue has its own `ansible_failed_task` / `ansible_failed_result`

```yaml
  rescue:
    - debug:
        var: ansible_failed_result.stderr
```

Useful to print `nginx -t` stderr without registering every command yourself.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| Rescue without `fail` | play continues; you think the host is fine |
| Reload nginx in `always` | reload after a failed test |
| `ignore_errors` on the whole play | one permission denied, 40 more tasks on a broken box |
| Forgetting `remote_src` on backup `copy` | Ansible looks for the file on **lab** |
| Nested blocks five deep | unreadable — extract a role |

---

## In production

- Rescue is for **known** failure modes (config test, lock, API 429). It is not a substitute for CI `--syntax-check` and `--check`.
- Alerting: a rescued-then-`fail` host still shows `failed=` in the recap — keep it that way.
- Molecule / CI should include a case that **enters** rescue (broken fixture).

---

## Summary

A **`block`** shares settings and defines **`rescue`** (on failure) and **`always`** (cleanup). End rescue with **`fail`** if the host must not continue. This is the structured alternative to `ignore_errors: true`.

## Checklist

- [ ] When does `rescue` run?
- [ ] Why put `fail:` at the end of rescue?
- [ ] What is `remote_src: true` for?
- [ ] Why is reloading nginx in `always` a bad idea?

Next: [19. Everyday modules](19-modules.md).
