# 05. Лаба: producer, ключи и kcat

## Цель лабы

Отправить сообщения с **разными key**, убедиться, что записи с одним key попадают в **одну partition**. Повторить отправку с **хоста** через **kcat** (если установлен).

## Предварительно

- Стенд поднят: [`deploy/kafka`](../../deploy/kafka/README.md).
- Лаба [03](03-lab-first-topic.md) пройдена.

Опционально: [kcat](https://github.com/edenhill/kcat) (`brew install kcat` / `choco install kcat`).

---

## Задание 1. Topic для ключей

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.producer-keys \
  --partitions 6 --replication-factor 1 \
  --if-not-exists
```

---

## Задание 2. Три заказа, по два события

**Зачем:** увидеть стабильную partition для key.

```bash
docker exec -i mock-kafka bash -c '
  /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.producer-keys \
    --property parse.key=true \
    --property key.separator=:
' <<EOF
ord-1:created
ord-1:paid
ord-2:created
ord-2:paid
ord-3:created
ord-3:paid
EOF
```

---

## Задание 3. Просмотр partition по key

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.producer-keys \
  --from-beginning \
  --property print.key=true \
  --property print.partition=true \
  --property key.separator=: \
  --timeout-ms 8000
```

**Что увидите:** для `ord-1` обе строки с **одинаковым** `Partition: N`; для `ord-2` и `ord-3` — свои номера (могут совпасть случайно — маловероятно при 6 partition).

Запишите в блокнот:

```text
ord-1 -> partition ___
ord-2 -> partition ___
ord-3 -> partition ___
```

---

## Задание 4. kcat с хоста (опционально)

**Зачем:** так же подключаются приложения на laptop.

```bash
kcat -b localhost:9094 -L
echo 'ord-1:shipped' | kcat -b localhost:9094 -t lab.producer-keys -K:
kcat -b localhost:9094 -t lab.producer-keys -C -o beginning -f 'p=%p key=%k %s\n'
```

**Что увидите:** `ord-1:shipped` в **той же** partition, что и `ord-1:created`.

**Если kcat нет:** пропустите; достаточно CLI в контейнере.

---

## Задание 5. Сообщение без key

```bash
echo 'no-key-event' | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.producer-keys
```

Consumer снова — запись без key, partition по round-robin.

---

## Критерии успеха

- [ ] Topic `lab.producer-keys` с 6 partition
- [ ] События `ord-1:*` в одной partition
- [ ] Таблица ord → partition заполнена
- [ ] (Опц.) kcat с `localhost:9094` отправил и прочитал запись

## Что унести в работу

- Формат `key:value` в console producer: `parse.key=true` и separator.
- Bootstrap **9094** с хоста, **9092** в `docker exec`.

Следующий урок: [06. Consumer](06-consumer.md).
