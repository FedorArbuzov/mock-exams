# 08. Lab: shop database

## Ticket

P2 — platform

Database `shop`, table `shop.events` **ReplicatedMergeTree** `ON CLUSTER nimbus`, user `shop_app` from Vault. Idempotent.

## Task

`playbooks/schema.yml`, tag `schema`.

1. `run_once`: `CREATE DATABASE` / `CREATE TABLE` from [07](07-schema.md).
2. All hosts: `users.d/shop_app.xml` — password `{{ vault_shop_app_password }}`. Networks at least `192.168.60.0/24`.
3. Encrypt `group_vars/all/vault.yml`.

Picture: [`examples/playbooks/schema.yml`](examples/playbooks/schema.yml).

```bash
cd ~/nimbus-ch
ansible-playbook playbooks/schema.yml --ask-vault-pass
ansible-playbook playbooks/schema.yml --ask-vault-pass
```

```bash
# any node
clickhouse-client --query "EXISTS TABLE shop.events"
clickhouse-client --query "SELECT hostName() FROM clusterAllReplicas('nimbus', system.tables) WHERE database='shop' AND name='events'"
```

Three hosts should see the table. Then:

```bash
clickhouse-client --user shop_app --password … --query "INSERT INTO shop.events VALUES (now(), 1, 'lab08')"
```

If `GRANT` errors (`access management` / not enough privileges), give the default user `<access_management>1</access_management>` in `users.d` (day-2 fragment, not `roles/cluster`) and `SYSTEM RELOAD CONFIG`. XML `users.d` still needs a SQL `GRANT` on 24.8 for `shop.*`.

## Success criteria

- [ ] `shop.events` exists on all three (`clusterAllReplicas` or query each host)
- [ ] engine is ReplicatedMergeTree, cluster `nimbus`
- [ ] `shop_app` can INSERT (GRANT enough)
- [ ] vault file is encrypted
- [ ] second apply does not error

Next: [09. Replication](09-replication.md).
