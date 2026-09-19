# 07. Databases, users, indexes as code

Creating `shop` on whichever node is PRIMARY *today* is an API call against **MongoDB**, not a file on all three hosts. `community.mongodb` modules talk to one endpoint — and they must discover it.

## Connect to the PRIMARY

```text
1. mongodb_status → replicaset dict → host whose state is PRIMARY
2. or: mongosh rs.status() and read me
```

A lookup / `set_fact` from `mongodb_status` (see the module examples: loop the returned `replicaset` map) then `mongodb_user` / `mongodb_index` with `replica_set: nimbus` is the grown-up pattern. Hard-coding `192.168.59.10` is wrong after lesson 10. If you initiated with IPs, the PRIMARY key is an IP — map it to an inventory host.

`mongodb_user` with `replica_set` set will follow PRIMARY for writes. Still discover — do not skip status and hope.

MongoDB creates a database on first write. `shop` “exists” when the user and an index (or a probe document) live there. That is enough.

## Data

```yaml
nimbus_databases:
  - name: shop
nimbus_users:
  - name: shop_app
    password: "{{ vault_shop_app_password }}"
    database: shop
    roles: [readWrite]
nimbus_indexes:
  - database: shop
    collection: orders
    keys: { order_id: 1 }
    options: { name: idx_order_id, unique: true }
```

Modules: `mongodb_user`, `mongodb_index`. Admin creds from Vault (`login_user` / `login_password` / `login_database: admin`).

Do **not** create users on a SECONDARY with a direct connection and no `replica_set` (`not master` / `not primary`).

## Checklist

- [ ] Objects are inventory + Vault
- [ ] Play discovers PRIMARY
- [ ] Collection modules, not `shell: mongosh` unless a module cannot

Next: [08. Lab: shop](08-lab-objects.md).
