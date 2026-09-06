# 10b. Handlers: reload once when config changes

## Intro: restarting nginx on every task drops connections

Naive playbook:

```yaml
- template: dest=/etc/nginx/sites-available/lab.conf ...
- systemd: name=nginx state=restarted
- file: dest=/etc/nginx/sites-enabled/lab.conf state=link
- systemd: name=nginx state=restarted
```

Every run **restarts** nginx even when the file is unchanged (`restarted` means “do it now”). During a restart, in-flight requests die. You also bounce the service twice in one play.

**Handlers** are tasks that run **only if notified**, and **once per play** even if ten tasks notify the same handler. The usual notify is “config file changed.” The usual action is **`reloaded`**, not `restarted` — nginx picks up vhosts without dropping the master process.

## What you'll learn

- `notify:` / handler `name:` matching.
- Why handlers run at **end of play** (and `flush_handlers`).
- `reloaded` vs `restarted`.
- `listen:` for shared handler names.
- Validate-then-reload so a bad template does not take the site down.

---

## The handler file

```yaml
# roles/nginx/handlers/main.yml
---
- name: Reload nginx
  systemd:
    name: "{{ nginx_service }}"
    state: reloaded
```

Tasks:

```yaml
- name: Deploy vhost
  template:
    src: ansible-lab.conf.j2
    dest: /etc/nginx/sites-available/ansible-lab.conf
    mode: "0644"
  notify: Reload nginx

- name: Enable site
  file:
    src: /etc/nginx/sites-available/ansible-lab.conf
    dest: /etc/nginx/sites-enabled/ansible-lab.conf
    state: link
  notify: Reload nginx
```

The string after `notify:` must equal the handler’s **`name:`** (or a `listen:` alias). Typos mean silence: the file updates, nginx keeps the old config in memory until someone reloads by hand.

---

## When the handler actually runs

| Run | Template task | Handler |
|-----|----------------|---------|
| First apply | `changed` | **RUNNING HANDLER** Reload nginx |
| Second apply, no edits | `ok` | handler **not** started |
| You change `nginx_server_name` in host_vars | template `changed` | handler runs once |

Two notifies in the same play still run **Reload nginx** a **single** time at the end — both the template and the symlink can `notify` safely.

Handlers run after all tasks in the play (unless you flush). If a later task **fails**, pending handlers may **not** run — the service might have new files on disk and old config in memory. Fix the play and re-run.

---

## `reloaded` vs `restarted`

| `systemd` state | Effect on nginx |
|-----------------|-----------------|
| `reloaded` | `nginx -s reload` — workers recycle, preferred for vhost changes |
| `restarted` | stop + start — use for module loads / binary upgrade |
| `started` | start if down; do not reload config |

Package install + first start: `state: started`, `enabled: true` in a normal **task**, not a handler. Handlers are for **change reactions**.

---

## `listen:` — stable event names

When several roles should trigger the same reload:

```yaml
# handlers/main.yml
- name: Reload nginx
  listen: "restart web stack"
  systemd:
    name: "{{ nginx_service }}"
    state: reloaded
```

```yaml
notify: "restart web stack"
```

Useful in larger repos. In this course, matching on `name: Reload nginx` is enough.

---

## `meta: flush_handlers` — when end-of-play is too late

Rare but real: you template a firewall rule that must be **active** before the next task opens a port test.

```yaml
- name: Deploy nftables snippet
  template:
    src: lab.nft.j2
    dest: /etc/nftables.d/lab.nft
  notify: Reload nftables

- meta: flush_handlers

- name: Probe nginx now that firewall is live
  wait_for:
    port: 80
    host: "{{ ansible_default_ipv4.address }}"
```

Without `flush_handlers`, `wait_for` might run **before** nftables reloads. For nginx vhosts you usually do **not** need this — reload at end of play is correct.

---

## Safety: test config before reload

A broken `.j2` plus an eager reload takes production down. Pattern:

```yaml
- name: Deploy vhost
  template:
    src: ansible-lab.conf.j2
    dest: /etc/nginx/sites-available/ansible-lab.conf
    mode: "0644"
  notify: Reload nginx

- name: Enable site
  file:
    src: /etc/nginx/sites-available/ansible-lab.conf
    dest: /etc/nginx/sites-enabled/ansible-lab.conf
    state: link
  notify: Reload nginx

- name: Validate nginx config
  command: nginx -t
  changed_when: false
  notify: Reload nginx
```

If `nginx -t` **fails**, the play fails and the handler does **not** run — but the bad file is already in `sites-available`. Better: `validate:` on the template module, or template to `.conf.new`, test, then `copy` into place.

Lab 11: at least run `nginx -t` by hand after the play. Adding `command: nginx -t` + `changed_when: false` is a good extra.

Optional handler that only reloads if test passed is overkill here; failing `nginx -t` as a task is enough.

---

## Seeing handlers in output

```bash
ansible-playbook site.yml
ansible-playbook site.yml --diff
```

After a variable change you want:

```text
changed: [web] => (item=...)   # or changed on template
RUNNING HANDLER [nginx : Reload nginx]
```

Second run: no `RUNNING HANDLER`. If the handler **always** runs, a task is `changed` every time (`command` without `changed_when`, or a template that embeds a timestamp).

---

## Common mistakes

| Mistake | What happens |
|---------|----------------|
| `notify: reload nginx` vs name `Reload nginx` | handler never runs (case / wording) |
| Handler in `tasks/main.yml` instead of `handlers/` | it runs as a normal task every time |
| `state: restarted` in a regular task at the end | downtime every play |
| Timestamp in the template (`{{ now() }}`) | file always changes → handler always fires |
| Handler name duplicated in two roles | confusing which one runs — use `listen` or unique names |

---

## In production

- Reload vs restart is part of the **SLA**: prefer reload.
- Some units only support `restarted` (poor ExecReload) — check `systemctl cat`.
- `listen:` + a small `handlers` role for “restart logging stack” across roles.

---

## Summary

**Handlers** decouple “file changed” from “bounce the service.” Notify from `template` / `file` / `copy`; run **`reloaded` once** at play end. Keep handler `name` and `notify` identical.

## Checklist

- [ ] What triggers a handler?
- [ ] Why can five tasks notify the same handler without five reloads?
- [ ] `reloaded` vs `restarted` for an nginx vhost change?
- [ ] Why might a handler not run after a mid-play failure?

Next lab: [11. Lab: vhost from a template](11-lab-templates.md).
