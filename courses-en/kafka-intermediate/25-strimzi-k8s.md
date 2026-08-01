# 25. Strimzi on Kubernetes (theory only)

## Intro: "Kafka in a Helm chart across three pods"

Self-managed Kafka in Kubernetes without an operator is painful — **persistent volume**, **rolling upgrade**, **listener DNS**, and **broker id**. **Strimzi** is a CNCF operator: Custom Resources describe the cluster, Topic, User; the operator reconciles the **desired state** with the actual one.

There is **no** lab in this chapter — a K8s cluster is needed ([`kuber-intermediate`](../kuber-intermediate/README.md)). The goal is to understand the **model** for kafka-advanced and production planning.

## What you'll learn

- CR: **Kafka**, **KafkaNodePool**, **KafkaTopic**, **KafkaUser**.
- Listeners: **internal**, **route**, **ingress**, **tls**.
- KRaft mode in Strimzi 0.39+.
- The link with **GitOps** (Argo CD).
- The difference from "just docker compose".

---

## Operator architecture

```mermaid
flowchart TB
  OP[Strimzi Cluster Operator]
  OP --> K[Kafka CR]
  OP --> T[KafkaTopic CR]
  OP --> U[KafkaUser CR]
  K --> P[Pods brokers + controllers]
  T --> KT[Topics in cluster]
  U --> ACL certs SCRAM
```

The operator watches over the StatefulSet, Services, ConfigMaps, certificates.

## Kafka CR (simplified example)

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: Kafka
metadata:
  name: shop-cluster
spec:
  kafka:
    version: 3.7.0
    replicas: 3
    listeners:
      - name: plain
        port: 9092
        type: internal
        tls: false
      - name: tls
        port: 9093
        type: internal
        tls: true
    config:
      offsets.topic.replication.factor: 3
      transaction.state.log.replication.factor: 3
      default.replication.factor: 3
      min.insync.replicas: 2
  entityOperator:
    topicOperator: {}
    userOperator: {}
```

In production **tls: true**, **authentication** (SCRAM/TLS), **no plain**.

## KafkaNodePool (KRaft)

Separating the **controller** and **broker** roles into distinct pools — scaling and upgrade without mixing roles on one pod (depends on the Strimzi version).

## KafkaTopic CR

```yaml
apiVersion: kafka.strimzi.io/v1beta2
kind: KafkaTopic
metadata:
  name: orders
  labels:
    strimzi.io/cluster: shop-cluster
spec:
  partitions: 12
  replicas: 3
  config:
    retention.ms: 604800000
```

The Topic Operator creates/updates the topic in the cluster; manual drift via the CLI conflicts with GitOps.

## KafkaUser CR

- Generation of **TLS** certs or **SCRAM** credentials.
- Synchronization of **ACL** with the User Operator.

The link with [19-security-basics](19-security-basics.md).

## Listeners and clients

| type | Client |
|------|--------|
| internal | applications inside K8s |
| route / ingress | external (careful, mTLS) |
| cluster-ip | service discovery |

**Advertised addresses** must match what the client sees — the same problem as `advertised.listeners` in Docker.

## Upgrade

Strimzi supports a **rolling update** of the Kafka version via the CR `version`. Order: operator → brokers → (verify).

Monitoring: a Kafka Exporter sidecar, JMX, Prometheus rules.

## Strimzi vs the docker compose training stand

| Aspect | compose cluster | Strimzi |
|--------|-----------------|--------|
| RF=3 | 3 containers | 3+ pods + PV |
| ACL | PLAINTEXT lab | User CR + TLS |
| Topic create | CLI | KafkaTopic CR |
| Day-2 | manual docker | operator reconciliation |

## Connect and Registry

Strimzi deploys a **KafkaConnect** CR, a **KafkaConnector** CR; Schema Registry is often a separate Helm (Confluent) or Karapace.

## Common mistakes

| Mistake | Cause |
|--------|---------|
| Topic manually, not via a CR | drift, deletion by the operator |
| Insufficient PV IOPS | a slow consumer on the broker |
| A plain listener facing outward | data leak |
| A single Kafka CR without node pools on KRaft | a complex upgrade |

## Summary

Strimzi is the **Kubernetes-native** way to live with Kafka: declarative CRs, an operator, integration with TLS/ACL. The training compose teaches the mechanics; Strimzi is **how it runs in prod K8s**.

## Checklist

- [ ] You named the CRs: Kafka, KafkaTopic, KafkaUser.
- [ ] You understand the role of the Topic/User Operator.
- [ ] You linked listeners with advertised addresses.

**Next:** [27. Final project](27-final-project.md).
