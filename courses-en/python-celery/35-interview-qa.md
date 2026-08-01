# 35. Interview Q&A: Celery (top 35)

## Basics

**1. What is Celery?** Distributed task queue for Python — async background jobs.

**2. Components?** Producer, broker, worker, result backend, beat.

**3. Celery vs cron?** Cron = schedule only; Celery = event-driven + schedule + scale workers.

**4. Celery vs SQS?** Celery = Python framework + self-hosted broker; SQS = managed AWS service.

**5. Celery vs Kafka?** Queue (task consumed once) vs log (replay, many consumers).

---

## Broker / backend

**6. RabbitMQ vs Redis broker?** Rabbit: routing, durability; Redis: simpler, faster, fewer features.

**7. Why separate broker and result backend?** Different roles; scale independently; Redis results + Rabbit broker common.

**8. task_ignore_result?** Skip storing return value — less Redis load.

---

## Reliability

**9. At-least-once vs exactly-once?** Celery at-least-once; exactly-once needs idempotency + design.

**10. acks_late?** Ack after task completes — crash redelivers.

**11. prefetch_multiplier?** Messages prefetched per worker slot; low for long tasks.

**12. Idempotency?** Same task twice = same business outcome; use DB unique keys.

**13. Transactional outbox?** Atomic DB write + event; poller publishes to queue.

**14. max_retries?** Cap retries; then FAILURE.

**15. Reject vs retry?** Reject permanent; retry transient.

---

## Workflows

**16. chain vs group?** Sequential vs parallel.

**17. chord?** Group then callback when all succeed.

**18. Beat singleton?** One scheduler or duplicate periodic runs.

---

## Operations

**19. Flower?** Monitoring UI for workers/tasks.

**20. Scale what?** Workers horizontally; API separately.

**21. PENDING forever?** No worker or wrong queue.

**22. poison message?** DLQ, max_retries, Reject.

**23. graceful shutdown?** SIGTERM finish current task.

---

## Integration

**24. Django on_commit?** Enqueue after DB commit.

**25. Don't .get() in HTTP?** Blocks request; return task_id.

**26. Testing without broker?** task_always_eager or call fn directly.

---

## Advanced

**27. rate_limit?** Per-worker throttle on task.

**28. priority queues?** RabbitMQ 0-9; requires max_priority.

**29. time_limit?** Hard kill long tasks.

**30. canvas chord needs backend?** Yes for result aggregation.

**31. JSON serialization limit?** No arbitrary objects; pass IDs.

**32. worker pool types?** prefork, solo, gevent, eventlet.

**33. CELERY_TASK_ALWAYS_EAGER prod?** Never — disables queue.

**34. duplicate beat?** Double periodic execution.

**35. security?** JSON not pickle; private broker; no public Flower.

---

Practice: [36-capstone](36-capstone.md). Cheatsheet: [interview-cheatsheet](interview-cheatsheet.md).

Next: [36-capstone](36-capstone.md).
