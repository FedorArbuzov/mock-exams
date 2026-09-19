# 08. Lab: shop database

## Ticket

P2 — platform

Database `shop`, role `shop_app`, password in Vault. Idempotent. Works **after** a switchover (lesson 10 will prove it).

## Task

`playbooks/objects.yml`, tag `objects`. Discover the leader, then `community.postgresql`. Encrypt `group_vars/all/vault.yml` (`vault_shop_app_password`). Picture: [`examples/playbooks/objects.yml`](examples/playbooks/objects.yml).

```bash
ansible-playbook playbooks/objects.yml --ask-vault-pass
ansible-playbook playbooks/objects.yml --ask-vault-pass
```

```bash
# on the leader
psql -d shop -c '\du shop_app'
```

## Success criteria

- [ ] `shop` exists only once (not on each node as a leftover)
- [ ] `shop_app` can connect to `shop` (GRANT enough for `\conninfo`)
- [ ] vault file is encrypted
- [ ] second apply does not error

Next: [08b. Lab: shop cannot connect](08b-lab-access.md).
