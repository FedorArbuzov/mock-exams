# 22. Лаба: DLQ — poison message и replay

## Цель

Смоделировать **poison message**: основной topic, DLQ topic, ручной «failed» record и **replay** в основной поток с проверкой **idempotency key**.

## Предварительно

- [21-poison-dlq-replay](21-poison-dlq-replay.md).
- `deploy/kafka`, `docker compose up -d`.

---

## Задание 1. Topics

```bash
BS=localhost:9092

for T in lab.orders.events lab.orders.events.dlq; do
  docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
    --bootstrap-server $BS \
    --create --topic $T --partitions 3 --replication-factor 1 --if-not-exists
done
```

---

## Задание 2. «Хорошие» и poison события

Формат: `eventId|json` (ключ = eventId через kcat).

```bash
echo 'e1:{"eventId":"e1","orderId":"o1","amount":100}' | kcat -b localhost:9094 -t lab.orders.events -K: -P
echo 'e2:{"eventId":"e2","orderId":"o2","amount":-1}'  | kcat -b localhost:9094 -t lab.orders.events -K: -P
echo 'e3:{"eventId":"e3","orderId":"o3","amount":50}'  | kcat -b localhost:9094 -t lab.orders.events -K: -P
```

**Правило consumer (симуляция):** `amount < 0` → poison.

---

## Задание 3. Переместить poison в DLQ (вручную)

Прочитайте e2 и запишите в DLQ с заголовком-метаданным в payload:

```bash
echo 'e2:{"eventId":"e2","orderId":"o2","amount":-1,"_dlq":{"reason":"negative_amount","source":"lab.orders.events"}}' \
  | kcat -b localhost:9094 -t lab.orders.events.dlq -K: -P
```

В production это делает **error handler** автоматически.

---

## Задание 4. Consumer только «хорошие»

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS \
  --topic lab.orders.events \
  --from-beginning \
  --property print.key=true \
  --timeout-ms 6000
```

Отметьте: e2 всё ещё в main topic (не удаляется автоматически). **Стратегии:**

- **seek** past poison;
- или **transactional** skip;
- или compacted tombstone (редко).

Обсудите на интервью.

---

## Задание 5. Fix и replay

Исправленное событие:

```bash
echo 'e2:{"eventId":"e2","orderId":"o2","amount":99}' | kcat -b localhost:9094 -t lab.orders.events -K: -P
```

**Idempotency:** downstream хранит `processed_eventIds`. Повторный replay e1 **не** должен удвоить side effect.

Таблица (tabletop):

| eventId | Первый process | Replay | Результат |
|---------|----------------|--------|-----------|
| e1 | OK | skip | OK |
| e2 | fail → DLQ | OK after fix | OK once |

---

## Задание 6. Consume DLQ (audit)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server $BS \
  --topic lab.orders.events.dlq \
  --from-beginning --timeout-ms 5000
```

---

## Критерии успеха

- [ ] Создали main + DLQ topics.
- [ ] Отправили poison, поместили копию в DLQ с reason.
- [ ] Replay исправленного e2.
- [ ] Объяснили idempotency при replay.

**Дальше:** [23-capstone](23-capstone.md).
