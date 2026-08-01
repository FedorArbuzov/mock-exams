# Cluster notes — template for labs and capstone

Fill in during [03-lab-cluster](../03-lab-cluster.md) and [18-capstone](../18-capstone.md).

## Stand

| Parameter | Value |
|----------|----------|
| Compose file | `deploy/redis/docker-compose.cluster.yml` |
| Init script | `deploy/redis/scripts/init-cluster.sh` |
| Date | |
| OS / Docker | |

## CLUSTER INFO (after init)

```text
# paste output: redis-cli -c -p 7001 CLUSTER INFO
```

| Field | Value |
|------|----------|
| cluster_state | |
| cluster_slots_assigned | |
| cluster_known_nodes | |
| cluster_size | |

## NODES topology

| Node | Role | Node ID (short) | Replicates |
|------|------|------------------|------------|
| redis-1:6379 | | | |
| redis-2:6379 | | | |
| redis-3:6379 | | | |
| redis-4:6379 | | | |
| redis-5:6379 | | | |
| redis-6:6379 | | | |

## MOVED example (without -c)

```text
# redis-cli -p 7001 SET test:moved 1
# (MOVED ... reply)
```

## Hash tag

| Key | Slot |
|------|------|
| `order:{lab99}:hdr` | |
| `order:lab99:hdr` | |

## Failover lab

| Metric | Value |
|---------|----------|
| Stopped container | |
| Time until GET recovered | ~ s |
| Data loss? | yes / no |

## Stampede / jitter (lab 05)

- Parallel misses without lock: 
- With lock / jitter notes: 

## Security checklist (capstone)

- [ ] SG: 6379 app subnet only
- [ ] ufw/nftables ([firewall](../../linux-intermediate/07-firewall.md))
- [ ] ACL default off
- [ ] FLUSHALL / DEBUG disabled
- [ ] TLS in prod

## Runbook: high latency

1. 
2. 
3. 

## Runbook: OOM

1. 
2. 
3. 

## Notes

_Free field for incidents, interviewer questions, ideas._
