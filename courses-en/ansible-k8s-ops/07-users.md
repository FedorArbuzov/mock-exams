# 07. Access lifecycle

Baseline closed passwords. People still come and go. Kubespray has no opinion about `lena`.

## One list is the source of truth

```yaml
# group_vars/all/users.yml
nimbus_users:
  - name: nimbus
    state: present
    groups: [sudo]
  - name: lena
    state: present
    groups: [sudo]
  - name: contractor
    state: absent
```

The playbook loops that list. Hire = add a dict. Fire = `state: absent` (or drop the entry if you treat “missing from list” as delete — pick one model and write it in the README).

Public keys live in Vault (`vault_lena_pubkey`) or in `files/` for the lab. Do **not** put a real production key in git in plaintext and then “fix it later.”

## Do not exclusive-manage `ubuntu`

`authorized_key` with `exclusive: true` on `ubuntu` will lock you out of the LXC the moment the playbook list is wrong. Manage keys for **Nimbus users only**. Leave `ubuntu` to the bootstrap key from lesson 02.

## sudo

Lab: `nimbus` / `lena` in `sudo` with NOPASSWD is acceptable on this stand. In a company you would use a sudoers drop-in and a ticket. Still: `visudo` syntax via `copy` + `validate: visudo -cf %s`.

## Revoke is the same playbook

There is no “hotfix ssh to all three and edit authorized_keys.” You change `users.yml` and re-run `--tags users`. If that is slower than Slack, the list is wrong or you do not have CI.

## Checklist

- [ ] Hire and fire are data, not a new playbook
- [ ] You will not `exclusive` the `ubuntu` key
- [ ] Vault or `files/` for pubkeys — not `group_vars` plaintext if you can help it

Next: [08. Lab: hire Lena, fire the contractor](08-lab-users.md).
