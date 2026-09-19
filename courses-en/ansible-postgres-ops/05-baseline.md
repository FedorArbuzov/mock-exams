# 05. Baseline next to Patroni

Autobase already owns packages, `postgresql.conf`, Patroni YAML, etcd. If `common` restarts `patroni` “to be safe,” you will drop connections on every apply.

`common`: chrony, sshd, `jq`/`htop`. No `shared_buffers`. No `pg_hba` (objects play / Autobase).

Clocks matter: etcd and Patroni TTL.

Next: [06. Lab: `common`](06-lab-baseline.md).
