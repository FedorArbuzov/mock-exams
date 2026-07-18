# 09. Лаба: Pub/Sub — заказы и инвалидация кэша

## Цель лабы

Запустить **SUBSCRIBE** в интерактивном CLI, отправить **PUBLISH** из второго терминала, проверить **PSUBSCRIBE** по шаблону. Смоделировать сигнал **инвалидации кэша**.

## Предварительно

- [08. Pub/Sub](08-pubsub.md).
- Два терминала (или вкладки).
- Каналы: **`lab:notify:`**

---

## Задание 1. Подписчик (терминал A)

**Зачем:** увидеть push-сообщения в реальном времени.

```bash
docker exec -it mock-redis redis-cli
```

Внутри CLI:

```text
SUBSCRIBE lab:notify:orders
```

**Что увидите:** `Reading messages...` и подтверждение подписки (`subscribe`, count 1).

Окно A **оставьте открытым**.

---

## Задание 2. Publisher (терминал B)

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:orders '{"orderId":"ord-lab-1","event":"paid"}'
```

**Что увидите в A:** строка `message`, канал `lab:notify:orders`, JSON payload.

Повторите с другим событием:

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:orders '{"orderId":"ord-lab-2","event":"created"}'
```

---

## Задание 3. Без подписчика

**Зачем:** подтвердить at-most-once / нет очереди.

В B (без активного SUBSCRIBE):

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:ghost "lost"
docker exec mock-redis redis-cli PUBSUB NUMSUB lab:notify:ghost
```

**Что увидите:** `(integer) 0` подписчиков — сообщение никому не доставлено.

---

## Задание 4. Pattern subscribe (новый терминал C, опционально)

В C:

```bash
docker exec -it mock-redis redis-cli
```

```text
PSUBSCRIBE lab:notify:*
```

Из B:

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:cache "invalidate:product:101"
docker exec mock-redis redis-cli PUBLISH lab:notify:alerts "cpu-high"
```

**Что увидите в C:** оба сообщения на разных «подканалах» шаблона.

---

## Задание 5. Связь с cache-aside

**Зачем:** типичный паттерн в проде.

1. Положите кэш:

```bash
docker exec mock-redis redis-cli SET lab:cache:product:101 '{"price":100}' EX 600
```

2. Опубликуйте инвалидацию (подписчик в приложении сделал бы `DEL`):

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:cache "DEL lab:cache:product:101"
```

3. Вручную выполните то, что сделал бы worker:

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:101
docker exec mock-redis redis-cli GET lab:cache:product:101
```

**Что увидите:** `(nil)` после DEL.

---

## Задание 6. Выход из подписки

В терминалах A/C: **Ctrl+C** или `UNSUBSCRIBE`.

---

## Критерии успеха

- [ ] SUBSCRIBE получил ≥2 PUBLISH
- [ ] PUBSUB NUMSUB показал 0 для канала без подписчиков
- [ ] (опц.) PSUBSCRIBE получил сообщения с разных каналов
- [ ] Понятна ручная инвалидация кэша по событию

## Что унести в работу

- Для SUBSCRIBE — **отдельное** соединение redis-cli / клиента.
- Pub/Sub не заменяет **очередь**; для заказов в billing — Kafka/SQS.
- Payload лучше **короткий** (id + тип события).

Следующий урок: [10. Pipeline и транзакции](10-pipeline-transactions.md).
