# 13. Disaster kit

A SECONDARY is not a backup. You need a copy **off** the nodes.

This course does **not** teach Ops Manager or `mongorestore` into a live set. You take a **logical** dump to `~/nimbus-mongo/backups/<stamp>/`.

## Minimum kit

| Piece | How |
|-------|-----|
| `mongodump` from the **PRIMARY** (or a SECONDARY with `--readPreference=secondary`) | `fetch` to the host |
| Replica-set **keyfile** | copy off the node — without it the dump is not a rebuild kit |
| Inventory + `group_vars` | already on the host — copy into the stamp dir |
| Admin / `shop_app` creds | Vault, not next to the tarball in git |

Do **not** `mongorestore` on the happy path. README: “restore is a separate, destructive play.”

`.gitignore` `backups/`.

Next: [14. Lab: mongodump](14-lab-backup.md).
