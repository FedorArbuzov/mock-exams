# 14b. Lab: RESTORE into a side database

## Ticket

P2 — DR rehearsal

Restore lesson 14’s File backup as **`shop_restore`**, not over `shop`.

```sql
RESTORE DATABASE shop AS shop_restore
FROM File('/var/backups/nimbus-ch/shop.zip');
-- path: the copy on a node, or fetch back one replica
SELECT count() FROM shop_restore.events;
```

Then `DROP DATABASE shop_restore ON CLUSTER nimbus` (or local if you restored on one node only — say which).

`shop.events` still writable. Do not `RESTORE` onto `shop` on a healthy cluster.

## Success criteria

- [ ] `shop_restore` had rows
- [ ] live `shop` unchanged
- [ ] restore is not inside `backup-cluster.yml`

Next: [15. Replace](15-replace.md).
