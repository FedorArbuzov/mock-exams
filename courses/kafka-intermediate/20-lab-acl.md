# 20. Лаба: ACL — синтаксис и модель (PLAINTEXT)

## Цель лабы

Освоить **`kafka-acls.sh`**: создать principal, выдать **ALLOW** на topic/group, **list** и **remove** ACL. На **PLAINTEXT** стенде фокус на **операторских командах**; реальный deny анонимного клиента требует secured cluster (см. примечание).

## Предварительно

- [19. Безопасность](19-security-basics.md).
- Кластер запущен.

> **Ограничение PLAINTEXT:** без `authorizer.class.name` и SASL/SSL многие ACL — **документация и привычка CLI**, а не жёсткое enforcement. В отчёте укажите: «в prod включим `StandardAuthorizer` + SCRAM».

---

## Задание 1. Список ACL (baseline)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 --list 2>&1
```

**Что увидите:** пустой список или предупреждение об authorizer — зафиксируйте вывод.

---

## Задание 2. Topic для сервиса

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.acl.orders \
  --partitions 3 --replication-factor 3
```

---

## Задание 3. Добавить ACL (концепт сервиса `User:orders-app`)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --add \
  --allow-principal User:orders-app \
  --operation Write --operation Describe \
  --topic lab.acl.orders

docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --add \
  --allow-principal User:orders-app \
  --operation Read \
  --group orders-app-consumer
```

---

## Задание 4. List по topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --list --topic lab.acl.orders
```

**Что увидите:** строки `ALLOW` для `User:orders-app`.

---

## Задание 5. Deny другому principal (документ)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --add \
  --deny-principal User:intruder \
  --operation Write \
  --topic lab.acl.orders
```

В secured cluster `intruder` при SASL user **intruder** получил бы **AuthorizationException** на produce.

На PLAINTEXT: produce **без** principal всё равно может пройти — **запишите это** в отчёт.

---

## Задание 6. Таблица прав для микросервиса

| Сервис | Topic | Group | Operations |
|--------|-------|-------|--------------|
| orders-api | lab.acl.orders | — | Write, Describe |
| orders-worker | lab.acl.orders | orders-app-consumer | Read, Describe |

---

## Задание 7. Remove ACL (cleanup)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-acls.sh \
  --bootstrap-server kafka-1:9092 \
  --remove \
  --allow-principal User:orders-app \
  --operation Write --operation Describe \
  --topic lab.acl.orders --force
```

---

## Критерии успеха

- [ ] Выполнили **add/list/remove** через `kafka-acls.sh`.
- [ ] Заполнили таблицу прав сервиса.
- [ ] Явно описали **ограничение PLAINTEXT** vs prod SASL+authorizer.

**Дальше:** [21. Ёмкость](21-capacity.md).
