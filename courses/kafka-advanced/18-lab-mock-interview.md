# 18. Лаба: mock interview — 45 минут

## Цель

Провести **симуляцию** technical interview: 15 мин theory rapid-fire, 20 мин system design lite, 10 мин ваши вопросы. Партнёр или самозапись с таймером.

## Предварительно

- [17-interview-qa](17-interview-qa.md) и [interview-cheatsheet](interview-cheatsheet.md) — прочитаны **до** сессии, не во время.
- Лист бумаги / заметки.

---

## Раунд 1 — Rapid fire (15 мин)

Партнёр (или вы с таймером) задаёт **10 вопросов** из списка, **30 секунд** на ответ вслух:

1. Что такое ISR?
2. Почему consumer count > partition count бесполезно?
3. `acks=all` но `min.insync.replicas=1` — что не так?
4. KRaft quorum 4 nodes — ок?
5. Difference log compaction vs retention delete?
6. EOS в Kafka Streams требует что на брокере?
7. MM2 topic name pattern?
8. ACL deny vs allow priority?
9. Симптом broker disk 100% — первые 3 шага?
10. Kafka vs queue для task workers?

**Оценка:** ≥7/10 без подглядывания — pass.

---

## Раунд 2 — System design lite (20 мин)

**Промпт:** «SaaS billing публикует `invoice.created` (5k/s peak). 12 downstream сервисов, Avro, GDPR EU-only, RPO 1h».

Нарисуйте на доске:

- topics (names, partitions estimate);
- Schema Registry placement;
- RF, `min.insync.replicas`;
- один DR регион (active-passive);
- monitoring (3 метрики);
- DLQ strategy (1 фраза).

**Rubric (партнёр ставит баллы):**

| 0 | 1 | 2 |
|---|---|---|
| Нет partition strategy | Key = customerId, N partition | + hot key mitigation |
| Нет RF | RF=3 mentioned | + min ISR |
| Нет DR | MM2 mentioned | + offset sync / RPO math |
| Нет security | TLS | + ACL per service |

≥6/8 — pass.

Эталонные идеи: [20-lab-system-design](20-lab-system-design.md).

---

## Раунд 3 — Behavioral + reverse (10 мин)

Подготовьте **STAR** 2 минуты: «расскажите про инцидент с Kafka lag».

Задайте интервьюеру **3 вопроса**:

- Какой managed Kafka?
- Кто on-call broker vs application?
- Как устроен schema governance?

---

## Самостоятельная запись

1. Запишите экран/голос раунда 2.
2. Переслушайте — отметьте **fillers** («ну», «короче») и пробелы.
3. Перепишите ответ через 24 ч без подглядывания.

---

## Критерии успеха

- [ ] Rapid fire ≥7/10.
- [ ] Design rubric ≥6/8.
- [ ] STAR история готова.
- [ ] 3 вопроса employer записаны.

**Дальше:** [19-system-design](19-system-design.md).
