# 10. Lab: result in Redis

## Goal

Trace a task result from SUCCESS to the Redis key and back through the API.

---

## Step 1. Trigger + poll

```bash
RESP=$(curl -s -X POST http://localhost:8093/tasks/add/?x=100&y=23)
TASK_ID=$(echo $RESP | python -c "import sys,json; print(json.load(sys.stdin)['task_id'])")

curl -s http://localhost:8093/tasks/$TASK_ID/
```

---

## Step 2. Redis key

```bash
docker exec mock-celery-redis redis-cli GET "celery-task-meta-$TASK_ID"
```

Should contain `"result":123` and `"status":"SUCCESS"`.

---

## Step 3. TTL check

```bash
docker exec mock-celery-redis redis-cli TTL "celery-task-meta-$TASK_ID"
```

Positive seconds — key expires (if `result_expires` is set).

---

## Step 4. FAILURE result

Trigger the fail task (if you added it in lab 05):

```bash
# after fail_task.delay()
docker exec mock-celery-redis redis-cli GET celery-task-meta-<id>
# status FAILURE, result exception info
```

---

## Step 5. ignore_result experiment

Temporarily:

```python
@shared_task(ignore_result=True)
def ping(...):
```

After a rebuild — the key **is not created** for ping. API state may stay PENDING without a backend — expected.

---

## Acceptance criteria

- [ ] SUCCESS task has a key in Redis
- [ ] GET API result matches the Redis JSON
- [ ] You understand the difference between ignore_result True/False

Next: [11-serialization](11-serialization.md).
