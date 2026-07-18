# 11. Лаба: JSON-события

## Цель лабы

Отправить **доменное событие** из файла [`order-created.json`](examples/events/order-created.json), прочитать и изменить `schemaVersion` / `orderId` — увидеть, что контракт — **ваша** ответственность.

## Предварительно

- Стенд Kafka up.
- [10. Сериализация](10-serialization.md).

---

## Задание 1. Topic для заказов

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic orders.events \
  --partitions 3 --replication-factor 1 \
  --if-not-exists
```

---

## Задание 2. Produce с key = orderId

**Зачем:** все события одного заказа в одной partition.

Из **корня репозитория** (Git Bash / WSL / Linux):

```bash
printf '%s\n' "ord-10042|$(cat courses/kafka-basic/examples/events/order-created.json)" | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --property parse.key=true \
  --property key.separator='|'
```

> Формат строки: `orderId|{...json в одну строку...}`. В PowerShell: прочитайте файл и подставьте в строку `ord-10042|...` вручную.

---

## Задание 3. Consume и проверка полей

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --from-beginning \
  --property print.key=true \
  --property print.partition=true \
  --timeout-ms 8000
```

**Что увидите:** key `ord-10042`, JSON с `eventType":"order.created"`, `totalCents":4599`.

---

## Задание 4. Второе событие «оплачен»

Создайте минимальный JSON (вручную или `echo`):

```bash
printf '%s\n' 'ord-10042|{"eventType":"order.paid","eventId":"evt-paid-1","occurredAt":"2026-05-18T14:35:00Z","schemaVersion":1,"order":{"orderId":"ord-10042","status":"PAID"}}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --property parse.key=true \
  --property key.separator='|'
```

Consumer с `--from-beginning` — **оба** события в **одной** partition.

---

## Задание 5. «Ломающее» изменение (мысленный эксперимент)

Отправьте событие, где `totalCents` — строка `"4599"` (как в задании — одна строка producer):

```bash
printf '%s\n' 'ord-10043|{"eventType":"order.created","eventId":"evt-bad-1","schemaVersion":2,"order":{"orderId":"ord-10043","totalCents":"4599"}}' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic orders.events \
  --property parse.key=true \
  --property key.separator='|'
```

**Зачем:** в коде consumer `int(totalCents)` упадёт — аргумент за Schema Registry.

---

## Критерии успеха

- [ ] Событие из `order-created.json` в topic `orders.events`
- [ ] Key совпадает с `orderId`, оба события `ord-10042` в одной partition
- [ ] Consumer прочитал валидный JSON с `eventType` и `eventId`
- [ ] Понимаете риск `schemaVersion:2` со строковым `totalCents`

## Что унести в работу

- Храните **примеры событий** в `examples/events/` рядом с курсом.
- Key = aggregate id (`orderId`).

Следующий урок: [12. Паттерны](12-patterns.md).
