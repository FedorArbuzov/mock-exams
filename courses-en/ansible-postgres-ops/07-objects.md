# 07. Databases and roles as code

Creating `shop` on whichever node is leader *today* is an API call against **Postgres**, not a file on all three hosts. `community.postgresql` talks to one endpoint.

## Connect to the leader

```text
1. patronictl list → Leader IP
2. or: query pg-01; if pg_is_in_recovery(), try the next host
```

A lookup / `set_fact` that SSHs `patronictl` once, then `delegate_to: localhost` with `community.postgresql` and `login_host: {{ leader_ip }}` is the grown-up pattern. Hard-coding `192.168.58.10` is wrong after lesson 10.

## Data

```yaml
nimbus_databases:
  - name: shop
nimbus_roles:
  - name: shop_app
    password: "{{ vault_shop_app_password }}"
    db: shop
    priv: CONNECT,CREATE   # tighten in the lab as you like
```

Modules: `postgresql_db`, `postgresql_user`, `postgresql_privs`. Superuser from Autobase / Vault (`login_user` / `login_password` or peer on the leader via `become_user: postgres` and `login_unix_socket`).

Peer on the leader (`become_user: postgres`) avoids putting the superuser password in the play if you `delegate_to` the leader host. That is often simpler on this stand.

Do **not** create objects on replicas (`cannot execute CREATE DATABASE in a read-only transaction`).

## Checklist

- [ ] Objects are inventory + Vault
- [ ] Play targets the **leader**
- [ ] `community.postgresql`, not `shell: psql` unless a module cannot

Next: [08. Lab: shop](08-lab-objects.md).
