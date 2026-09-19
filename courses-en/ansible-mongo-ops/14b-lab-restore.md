# 14b. Lab: mongorestore into a side database

## Ticket

P2 — DR rehearsal

Restore the dump from lesson 14 into **`shop_restore`**, not into `shop`. Live PRIMARY stays writable.

```text
mongorestore --nsFrom 'shop.*' --nsTo 'shop_restore.*' \
  --uri 'mongodb://…@PRIMARY:27017/?authSource=admin' \
  backups/<stamp>/dump
```

(Exact flags: `mongorestore --help` on 7.0. `--drop` only on `shop_restore` if it already exists.)

```text
mongosh … --eval 'db.getSiblingDB("shop_restore").orders.findOne()'
```

`shop` still has its data. Do not `--drop` `shop`.

## Success criteria

- [ ] `shop_restore` has documents
- [ ] `shop` untouched
- [ ] restore is a **separate** play or documented command, not inside `backup-cluster.yml`

Next: [15. Replace a member](15-replace.md).
