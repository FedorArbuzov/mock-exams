# 14. Лаба: ACL — allow, explicit deny (tabletop + optional broker)

## Цель лабы

Спроектировать **ACL matrix** для трёх сервисов, выполнить **deny-by-default** упражнение и (если брокер поддерживает authorizer в вашем образе) применить ACL через CLI.

## Предварительно

- [13-security-advanced](13-security-advanced.md).
- Стенд KRaft: `deploy/kafka`, `docker compose up -d`.

**Примечание:** default учебный образ может быть **без** `authorizer.class.name`. Часть заданий — **tabletop**; optional — включение `StandardAuthorizer` по документации вашей версии Kafka (только локально).

---

## Персонажи

| Сервис | Principal | Нужно |
|--------|-----------|-------|
| order-api | `User:order-api` | Write `orders.events`, Read `orders.dlq` |
| billing | `User:billing` | Read `orders.events`, Write `billing.invoices` |
| admin-tool | `User:admin` | Describe *, Create topic (break-glass) |

---

## Задание 1. Матрица ACL (tabletop)

Заполните таблицу Allow/Deny:

| Principal | Topic | Operation | Allow/Deny |
|-----------|-------|-----------|------------|
| order-api | orders.events | Write | Allow |
| order-api | billing.invoices | Write | **Deny** |
| billing | orders.events | Read | Allow |
| billing | orders.events | Write | **Deny** |
| billing | billing.invoices | Write | Allow |
| * | * | * | Deny (default) |

---

## Задание 2. Команды (эталон)

Когда включён SASL/SSL и authorizer:

```bash
# Allow order-api write
kafka-acls.sh --bootstrap-server $BS \
  --add --allow-principal User:order-api \
  --operation Write --topic orders.events

# Deny order-api write to billing
kafka-acls.sh --bootstrap-server $BS \
  --add --deny-principal User:order-api \
  --operation Write --topic billing.invoices

# Allow billing read orders
kafka-acls.sh --bootstrap-server $BS \
  --add --allow-principal User:billing \
  --operation Read --topic orders.events --group billing-consumer

# List ACLs
kafka-acls.sh --bootstrap-server $BS --list
```

**На собеседовании:** deny записывается **явно**; порядок оценки — deny wins.

---

## Задание 3. Симуляция отказа (без ACL broker)

Опишите ожидаемый **error code** при нарушении:

| Действие | Ожидание |
|----------|----------|
| billing пишет в `orders.events` | `TOPIC_AUTHORIZATION_FAILED` |
| order-api читает `billing.invoices` | `GROUP_AUTHORIZATION_FAILED` / topic auth |

---

## Задание 4. Super user policy

Напишите 3 правила для `super.users`:

1. Не более N человек.
2. MFA на break-glass.
3. Каждое использование — ticket + audit review.

---

## Задание 5. MSK IAM mapping (bonus)

| Kafka ACL | MSK IAM policy concept |
|-----------|------------------------|
| Write topic X | `kafka:WriteData` on topic ARN |
| Read group G | `kafka:ReadData` + group ARN |

Сверка с [11-managed-kafka](11-managed-kafka.md).

---

## Критерии успеха

- [ ] Матрица Allow/Deny для 3 сервисов.
- [ ] Объяснили deny vs default deny cluster.
- [ ] Назвали код ошибки authorization.
- [ ] (Optional) Применили `kafka-acls.sh --list`.

**Дальше:** [15-troubleshooting](15-troubleshooting.md).
