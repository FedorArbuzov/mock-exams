# 08. Lab: hire Lena, fire the contractor

## Ticket

P2 — access

HR: Lena starts Monday. Contractor `contractor` finished Friday. Keys on all Kubernetes nodes must match the list.

## Task 1. Users role

Role `roles/users`:

- loop `nimbus_users`
- `user` module (`state`, `groups`, `shell`)
- `authorized_key` for each present user
- sudoers drop-in for present sudo users
- `state: absent` removes the account (and ideally the sudoers snippet)

`nimbus` must exist on all three — later playbooks and the finale assume that name.

Generate **lab** keys on the control node if you need them:

```bash
mkdir -p ~/nimbus-ops/files/keys
test -f ~/nimbus-ops/files/keys/nimbus.pub || ssh-keygen -t ed25519 -N "" -f ~/nimbus-ops/files/keys/nimbus -C nimbus-lab
test -f ~/nimbus-ops/files/keys/lena.pub || ssh-keygen -t ed25519 -N "" -f ~/nimbus-ops/files/keys/lena -C lena-lab
```

Do not commit private keys. `files/keys/*.pub` is enough for the lab. Optional: encrypt a `vault.yml` that only stores the pubkey strings — same habit as [`ansible-basic` 12](../ansible-basic/12-vault-secrets.md).

Author picture: [`examples/roles/users`](examples/roles/users/tasks/main.yml). Collection: `ansible-galaxy collection install ansible.posix` (module `authorized_key`).

Wire the role into `site.yml` with tag `users`.

## Task 2. Hire

List `nimbus` + `lena` as present. Apply `--tags users`.

```bash
ssh -i ~/nimbus-ops/files/keys/lena lena@192.168.56.11 hostname
```

## Task 3. Fire

Add `contractor` as `present` once (create a throwaway key), apply, prove SSH works, then set `state: absent`, apply again. SSH as `contractor` must fail. `lena` and `nimbus` still work.

## Success criteria

- [ ] `nimbus` and `lena` exist on all three, keys work
- [ ] `contractor` is gone after the second apply
- [ ] `ubuntu` still has your original key
- [ ] `kubectl get nodes` unchanged

Next: [08b. Lab: who can reach the API](08b-lab-api-listen.md).
