# 20. Rolling updates: serial, limit, fail budget

## Intro: restart both app nodes in the same second

`hosts: app` with two hosts runs tasks in **parallel** (default forks). A play that `systemd: state=restarted` on the app unit will bounce **srv1 and srv2 together**. If the new unit file is broken, you have zero healthy backends behind nginx.

A **rolling** play takes hosts in batches: finish srv1 (or 20% of the fleet), then srv2. Combined with `--limit` you can canary one node by hand.

## What you'll learn

- `serial` (count or percentage).
- `max_fail_percentage` and `any_errors_fatal`.
- `--limit` vs `serial` (operator vs playbook).
- `throttle` and `order`.
- How this looks on a two-node `[app]` group.

---

## Default: all hosts in the play, in parallel

```yaml
- name: Restart app
  hosts: app
  become: true
  tasks:
    - systemd:
        name: nimbus-app
        state: restarted
```

Recap shows `srv1` and `srv2` under the same task at the same time. Fine for `apt` on a lab. Risky for restarts.

```bash
ansible-playbook site.yml --forks 1
```

`--forks 1` serializes **everything** globally. Prefer play-level `serial` so only that play is batched.

---

## `serial` — batches inside the play

```yaml
- name: Restart app rolling
  hosts: app
  become: true
  serial: 1
  tasks:
    - name: Restart nimbus-app
      systemd:
        name: nimbus-app
        state: restarted

    - name: Wait for port
      wait_for:
        port: "{{ app_port | default(8080) }}"
        host: 127.0.0.1
        delay: 1
        timeout: 20
```

With two hosts:

1. Batch 1: **srv1** — restart, wait. If this fails, srv2 is **not** started yet.
2. Batch 2: **srv2** — same tasks.

`serial: 50%` on ten hosts is five + five. `serial: [1, 2, "100%"]` is a canary of one, then two, then the rest (Ansible supports a list of batch sizes).

On our stand `serial: 1` is the only batch size that matters.

---

## Fail budget

```yaml
- hosts: app
  serial: 1
  max_fail_percentage: 0
```

`max_fail_percentage` — after a batch, if too many hosts in the **play** have failed, Ansible **aborts remaining batches**. `0` means “any failure stops the rollout.” Default is more lenient (continue to other hosts).

```yaml
- hosts: app
  any_errors_fatal: true
```

`any_errors_fatal` — one failed task aborts the **whole play** immediately (including other hosts already in the same batch). Stronger than max_fail.

For a two-node lab, `serial: 1` plus a failed `wait_for` on srv1 already protects srv2 if the play stops. Set `max_fail_percentage: 0` explicitly so the intent is documented.

---

## `--limit` — operator canary

```bash
ansible-playbook site.yml --limit srv1
ansible-playbook site.yml --limit web
ansible-playbook site.yml --limit 'app:&staging'   # if you have that group
```

`--limit` shrinks the inventory **before** the play. `serial: 1` with `--limit srv1` is a single host — serial does nothing visible.

Workflow:

1. `--limit srv1 --tags app` — canary.
2. Full play with `serial: 1` — rest of `[app]`.

`--limit` is not a substitute for `serial` in `site.yml`. The next person will run without `--limit`.

---

## `throttle` and host order

```yaml
- name: Heavy apt update
  apt:
    update_cache: true
    upgrade: dist
  throttle: 1
```

`throttle` limits **concurrent** hosts for **that task** (play can still be parallel). Use it for a shared Debian mirror you do not want to stampede.

```yaml
- hosts: app
  order: inventory   # or sorted, reverse_inventory, shuffle
  serial: 1
```

Default order is inventory order (`srv1` then `srv2` in [lab.ini](examples/inventory/lab.ini)). `shuffle` is for spreading load, not for a controlled canary.

---

## Strategy (know the name)

| `strategy:` | Behavior |
|-------------|----------|
| `linear` (default) | all hosts finish task N, then task N+1 |
| `free` | each host runs ahead — faster, harder to reason |

Stay on **linear** in this course. `free` plus `serial` is a combination you do not need on three boxes.

---

## Seeing batches in the output

```bash
ansible-playbook app-rollout.yml
```

You want a recap (or PLAY RECAP) after srv1 **before** srv2 tasks start. With `serial: 1` Ansible prints a play recap **per batch**.

```text
PLAY RECAP ********************************************************************
srv1 : ok=… changed=…

PLAY [Restart app rolling] ****************************************************
# now srv2
```

If both hosts appear under the first task together, `serial` is missing or you targeted a single-host group.

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `serial` on a play with `hosts: web` only | one host — no rolling |
| Restart in `roles/app` without `serial` on the **play** | role cannot set serial; the play must |
| Relying on `--limit` documented in a wiki | someone runs bare `site.yml` |
| `wait_for` host `0.0.0.0` | does not work; use `127.0.0.1` or the fact IP |
| `serial: 1` but `strategy: free` | confusing overlap — do not |

---

## In production

- Load balancer / nginx `upstream` + `max_fails` (see [nginx-basic](../nginx-basic/08-upstream.md)) plus Ansible `serial`.
- Kubernetes rolling Deployments are the same idea for pods; Ansible still rolls **VMs**.
- Health check after each batch (`uri` to `http://127.0.0.1:8080/` or `curl` through `web`).

---

## Summary

**`serial`** batches hosts in a play. **`max_fail_percentage: 0`** stops the rest of the fleet after a bad batch. **`--limit`** is a one-off canary, not the design. Next lab combines loops, tags, modules, and a rolling marker.

## Checklist

- [ ] What happens if you restart `[app]` without `serial`?
- [ ] Where do you set `serial` — role or play?
- [ ] `--limit srv1` vs `serial: 1` — which belongs in git?
- [ ] Why `wait_for` after a restart in the same batch?

Next lab: [21. Lab: baseline + rolling marker](21-lab-rollout.md).
