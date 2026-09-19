# 08b. Lab: shop cannot connect

## Ticket

P1 — access

The app on the LXD host (`192.168.58.1`) cannot open `shop` as `shop_app`. Cluster is healthy. This is **not** iptables and **not** failover.

Three layers (say them in 30 seconds on an interview):

| Layer | This stand | Prod |
|-------|------------|------|
| Perimeter | LXD NAT, port not published | security group / VLAN |
| Listen | Autobase `listen_addresses` | same, not `0.0.0.0` on a public NIC |
| Who is allowed | `pg_hba` + password | same |

## Task 1. Seed

On the **leader** only, put a reject **above** the shop_app allow (or comment the `192.168.58.0/24` line). Reload Postgres via Patroni (`patronictl reload` / Autobase config) — not `pg_ctl` on a replica.

From the **host**:

```text
psql -h <leader-ip> -U shop_app -d shop -c 'select 1'
```

Must fail (`pg_hba.conf rejects`). Superuser / peer on the node still works.

## Task 2. Close from git

`playbooks/access.yml` (or Autobase `pg_hba` extra-vars + `config_pgcluster` if **they** own the file — write which you used).

Allow `shop` / `shop_app` from `192.168.58.0/24`. No `0.0.0.0/0`. No `iptables -A`.

```bash
ansible-playbook playbooks/access.yml --ask-vault-pass
psql -h <leader-ip> -U shop_app -d shop -c 'select 1'
```

## Success criteria

- [ ] you saw the reject
- [ ] `shop_app` from the host works after the play
- [ ] you can name the three layers
- [ ] you did not “fix” with ufw

Next: [09. Switchover](09-switchover.md).
