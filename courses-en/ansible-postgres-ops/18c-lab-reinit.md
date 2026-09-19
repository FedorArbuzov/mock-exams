# 18c. Lab: reinit a replica

## Ticket

P1 — replica data untrusted

`pg-03` is still the same LXC and IP. You do **not** recycle the VM (that was lesson 16). Data on the replica is garbage. Rebuild it from the current leader.

Never run this against the Leader. Never `rm -rf` PGDATA yourself — Autobase / `patronictl reinit` owns the wipe.

## Task 1. Pin a replica

```text
patronictl list
```

If `pg-03` is Leader, switchover first (lesson 10). Confirm `pg-03` is Replica.

```bash
ansible pg-03 -b -m service -a "name=patroni state=stopped"
```

`patronictl list` should show `pg-03` stopped / unreachable. Leader and the other replica stay up. `shop` stays writable.

## Task 2. Reinit

Prefer Autobase:

```bash
ansible-playbook -i inventory/hosts.ini vitabaks.autobase.reinit_pgcluster
```

Extra-vars differ by version — read the playbook (`target` / member name). Write what you used in the README.

Fallback on a living member (as `postgres`):

```text
patronictl reinit <cluster> pg-03 --force
```

Cluster name is `nimbus-pg` unless you changed it.

Start Patroni on `pg-03` if the playbook did not. Wait until `Replica` / `running` and lag is small.

## Task 3. Proof

```text
patronictl list
# on the leader
SELECT application_name, state, replay_lag FROM pg_stat_replication;
```

`objects.yml` still green. You did not recreate the LXC.

## Success criteria

- [ ] `pg-03` is Replica, lag acceptable
- [ ] Leader never lost writes during reinit
- [ ] replace (lesson 16) vs reinit (this lab) is two bullets in the README
- [ ] you did not `rm -rf` PGDATA by hand

Next: [19. Monday + finale](19-lab-audit-finale.md).
