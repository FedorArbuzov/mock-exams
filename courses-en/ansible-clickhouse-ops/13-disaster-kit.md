# 13. Disaster kit

A replica is not a backup. You need a copy **off** the nodes.

You take **metadata + data** to `~/nimbus-ch/backups/<stamp>/`. This course does **not** run a restore on the happy path.

## Minimum kit

| Piece | How |
|-------|-----|
| `BACKUP` to `File` (or a configured disk) on **one** healthy replica | then `fetch` to the host |
| or `clickhouse-backup` | extra binary — optional after File works |
| Inventory + `roles/cluster` templates | already on the host — copy into the stamp dir |
| `shop_app` password | Vault, not next to the tarball in git |

```sql
-- path must be under backups.allowed_path (cluster role sketch)
BACKUP DATABASE shop TO File('/var/backups/nimbus-ch/shop.zip');
```

`BACKUP TABLE shop.events` is enough if `shop` has one table. Prefer **database** so you do not forget grants later. `ON CLUSTER` backups exist and are a different, fussier ticket — one replica + File is the lab.

`clickhouse-backup` (Altinity’s tool, not the operator) is a bonus if you already know it. Do not start there.

`.gitignore` `backups/`.

Restore is a **separate, destructive** play you do not write this week. README: “restore is not this playbook.”

## Checklist

- [ ] Backup is off-node
- [ ] Metadata + data, not “I have three replicas”
- [ ] You will not restore into a healthy 1×3 for fun

Next: [14. Lab: backup](14-lab-backup.md).
