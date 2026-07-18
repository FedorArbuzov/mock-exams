# 25. Strimzi на Kubernetes (только теория)

## Введение: «Kafka в Helm chart на три pod'а»

Self-managed Kafka в Kubernetes без оператора — боль с **persistent volume**, **rolling upgrade**, **listener DNS** и **broker id**. **Strimzi** — CNCF-оператор: Custom Resources описывают кластер, Topic, User; оператор сводит **desired state** с реальным.

Лабы в этой главе **нет** — нужен K8s-кластер ([`kuber-intermediate`](../kuber-intermediate/README.md)). Цель — понять **модель** для kafka-advanced и прод-планирования.

## Что вы узнаете

- CR: **Kafka**, **KafkaNodePool**, **KafkaTopic**, **KafkaUser**.
- Listeners: **internal**, **route**, **ingress**, **tls**.
- KRaft mode в Strimzi 0.39+.
- Связь с **GitOps** (Argo CD).
- Отличие от «просто docker compose».

---

## Архитектура оператора

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

Оператор следит за StatefulSet, Services, ConfigMaps, certificates.

## Kafka CR (упрощённый пример)

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

В production **tls: true**, **authentication** (SCRAM/TLS), **no plain**.

## KafkaNodePool (KRaft)

Разделение ролей **controller** и **broker** в отдельных pool — масштабирование и upgrade без смешения ролей на одном pod (зависит от версии Strimzi).

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

Topic Operator создаёт/обновляет topic в кластере; drift вручную через CLI конфликтует с GitOps.

## KafkaUser CR

- Генерация **TLS** certs или **SCRAM** credentials.
- Синхронизация **ACL** с User Operator.

Связь с [19-security-basics](19-security-basics.md).

## Listeners и клиенты

| type | Клиент |
|------|--------|
| internal | приложения внутри K8s |
| route / ingress | внешний (осторожно, mTLS) |
| cluster-ip | service discovery |

**Advertised addresses** должны совпадать с тем, что видит клиент — та же проблема, что `advertised.listeners` в Docker.

## Upgrade

Strimzi поддерживает **rolling update** версии Kafka по CR `version`. Порядок: operator → brokers → (verify).

Мониторинг: Kafka Exporter sidecar, JMX, Prometheus rules.

## Strimzi vs docker compose учебный стенд

| Аспект | compose cluster | Strimzi |
|--------|-----------------|--------|
| RF=3 | 3 контейнера | 3+ pods + PV |
| ACL | PLAINTEXT lab | User CR + TLS |
| Topic create | CLI | KafkaTopic CR |
| Day-2 | ручной docker | operator reconciliation |

## Connect и Registry

Strimzi разворачивает **KafkaConnect** CR, **KafkaConnector** CR; Schema Registry часто отдельным Helm (Confluent) или Karapace.

## Типичные ошибки

| Ошибка | Причина |
|--------|---------|
| Topic вручную, не через CR | drift, удаление operator'ом |
| Недостаточный PV IOPS | slow consumer на broker |
| Plain listener наружу | утечка данных |
| Один Kafka CR без node pools на KRaft | сложный upgrade |

## Резюме

Strimzi — **Kubernetes-native** способ жить с Kafka: декларативные CR, оператор, интеграция с TLS/ACL. Учебный compose учит механику; Strimzi — **как это едет в prod K8s**.

## Чек-лист

- [ ] Назвали CR: Kafka, KafkaTopic, KafkaUser.
- [ ] Понимаете роль Topic/User Operator.
- [ ] Связали listeners с advertised addresses.

**Дальше:** [27. Финальный проект](27-final-project.md).
