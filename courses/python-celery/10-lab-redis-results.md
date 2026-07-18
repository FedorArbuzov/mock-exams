# 10. Лаба: результат в Redis

## Цель

Проследить task result от SUCCESS до Redis key и обратно через API.

---

## Шаг 1. Trigger + poll

```bash
RESP=$(curl -s -X POST http://localhost:8093/tasks/add/?x=100&y=23)
TASK_ID=$(echo $RESP | python -c "import sys,json; print(json.load(sys.stdin)['task_id'])")

curl -s http://localhost:8093/tasks/$TASK_ID/
```

---

## Шаг 2. Redis key

```bash
docker exec mock-celery-redis redis-cli GET "celery-task-meta-$TASK_ID"
```

Должен содержать `"result":123` и `"status":"SUCCESS"`.

---

## Шаг 3. TTL check

```bash
docker exec mock-celery-redis redis-cli TTL "celery-task-meta-$TASK_ID"
```

Positive seconds — key expires (если `result_expires` set).

---

## Шаг 4. FAILURE result

Trigger fail task (если добавили в lab 05):

```bash
# после fail_task.delay()
docker exec mock-celery-redis redis-cli GET celery-task-meta-<id>
# status FAILURE, result exception info
```

---

## Шаг 5. ignore_result experiment

Временно:

```python
@shared_task(ignore_result=True)
def ping(...):
```

После rebuild — key **не создаётся** для ping. API state may stay PENDING without backend — ожидаемо.

---

## Критерии приёмки

- [ ] SUCCESS task имеет key в Redis
- [ ] GET API result matches Redis JSON
- [ ] Понимаете разницу ignore_result True/False

Далее: [11-serialization](11-serialization.md).
