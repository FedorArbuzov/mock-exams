# 07. Topics as code

`kafka-topics --create` in Slack is how `shop.orders` exists on two clusters with different `min.insync.replicas`. The list lives in git.

## Data, not a one-off

```yaml
# group_vars/all/topics.yml
nimbus_bootstrap: 192.168.57.10:9092
nimbus_topics:
  - name: shop.orders
    partitions: 6
    replication_factor: 3
    configs:
      min.insync.replicas: "2"
      retention.ms: "604800000"
  - name: shop.dead
    partitions: 3
    replication_factor: 3
    configs:
      min.insync.replicas: "2"
```

The playbook loops `--create --if-not-exists`, then `kafka-configs --alter` for the config map (create does not always apply every config the same way across versions — **describe** after).

`run_once` on `kafka_broker` (or `delegate_to: kafka-01`). Creating a topic is a **cluster** API call, not a per-host file.

## What you do not do here

- `auto.create.topics.enable=true` as a substitute for the list
- RF=1 “to make the lab easier” — then [lesson 10](10-lab-failover.md) teaches nothing
- partitions=1 on a “hot” topic and call it production-shaped

Increasing partitions later is allowed and **does not** re-key old records. Decreasing partitions is not a thing. Say that in the README.

## CLI vs `community.kafka`

`community.kafka` collection exists. This course uses the **scripts that operators already have on the box** after Confluent Ansible. One less moving part. If you already know the collection, you may use it — the Definition of Done is the topic state, not the module name.

## Checklist

- [ ] Topics are inventory data
- [ ] Create is `run_once`
- [ ] RF=3 / `min.insync.replicas=2` is the lab contract

Next: [08. Lab: shop topics](08-lab-topics.md).
