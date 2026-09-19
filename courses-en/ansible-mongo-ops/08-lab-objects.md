# 08. Lab: shop database

## Ticket

P2 — platform

Database `shop`, user `shop_app`, indexes as code. Password in Vault. Idempotent. Works **after** a stepDown (lesson 10 will prove it).

## Task

`playbooks/objects.yml`, tag `objects`. Discover PRIMARY with `mongodb_status`, then `mongodb_user` / `mongodb_index`. Encrypt `group_vars/all/vault.yml` (`vault_shop_app_password`, admin password if it is not already). Picture: [`examples/playbooks/objects.yml`](examples/playbooks/objects.yml).

```bash
ansible-playbook playbooks/objects.yml --ask-vault-pass
ansible-playbook playbooks/objects.yml --ask-vault-pass
```

```bash
# on the PRIMARY
mongosh -u shop_app -p ... --authenticationDatabase shop shop \
  --eval 'db.getCollectionInfos()'
```

## Success criteria

- [ ] `shop` exists (user + at least one named index)
- [ ] `shop_app` can authenticate on `shop`
- [ ] vault file is encrypted
- [ ] second apply does not error

Next: [09. stepDown](09-stepdown.md).
