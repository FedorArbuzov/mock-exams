# 10. Лаба: дубли при retry и идемпотентная обработка

## Цель лабы

Смоделировать **at-least-once** (повторная отправка того же события), показать **дубли** на consumer side и «исправить» учебной **дедуп-таблицей** (файл/память), объяснить, что **idempotent producer** решает дубли **в log**, а не в вашей БД.

## Предварительно

- [09. Семантики доставки](09-delivery-semantics.md).

---

## Задание 1. Topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.idempotency \
  --partitions 3 --replication-factor 3
```

---

## Задание 2. «Дублирующий» producer

Отправьте **одно и то же** бизнес-событие три раза (имитация retry без idempotence):

```bash
for _ in 1 2 3; do
  printf 'order-42|{"eventId":"evt-001","orderId":"order-42","amount":99}\n'
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.idempotency \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

---

## Задание 3. Consumer без дедупа

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.idempotency \
  --group lab-idem-naive \
  --from-beginning --timeout-ms 5000
```

**Что увидите:** **три** одинаковых JSON — naive handler списал бы 99 три раза.

---

## Задание 4. Дедуп по eventId (учебный скрипт)

Создайте файл `processed.txt` (пустой) на хосте. Псевдологика при чтении каждой строки:

1. Распарсить `eventId`.
2. Если `eventId` уже в `processed.txt` — **skip**.
3. Иначе — «применить платёж», дописать `eventId` в файл.

Выполните вручную для трёх строк из задания 3.

**Что увидите:** реальная обработка **один раз**, несмотря на три записи в log.

---

## Задание 5. Idempotent producer (концепт)

В Java/Kotlin:

```properties
enable.idempotence=true
acks=all
```

При **сетевом retry** одной и той же записи broker сохранит **одну** копию в partition. Повторите **задание 2** в приложении с idempotence (опционально) — в log одна запись.

На CLI без кода: зафиксируйте в отчёте разницу **дубль в log** vs **дубль в БД**.

---

## Задание 6. Новая consumer group — снова три сообщения

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.idempotency \
  --group lab-idem-fresh \
  --from-beginning --timeout-ms 5000
```

**Что увидите:** снова 3 строки — дедуп-файл защищает только **ваш** процесс; новая группа читает log заново.

---

## Критерии успеха

- [ ] Показали **три** записи в topic от «retry».
- [ ] Реализовали **дедуп по eventId** вручную.
- [ ] Объяснили: idempotent producer ≠ идемпотентность **downstream**.
- [ ] Понимаете, зачем **уникальный eventId** в контракте события.

**Дальше:** [11. Транзакции](11-transactions-eos.md).
