# 06. Lab: Job, CronJob, failure behavior

## Setup

```bash
kubectl create namespace lab-jobs
kubectl config set-context --current --namespace=lab-jobs
```

## Task 1. Simple Job

`hello-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: hello
spec:
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: hi
          image: busybox
          command: ["sh", "-c", "echo hello && sleep 3 && echo done"]
  backoffLimit: 2
  ttlSecondsAfterFinished: 60
```

```bash
kubectl apply -f hello-job.yaml
kubectl get jobs -w        # wait for completions=1/1
kubectl logs job/hello
```

**What you'll see:** the Job in `Completed`, a pod with `Completed` status, and in the logs — `hello` and `done`. After a minute the Job disappears on its own (thanks to the TTL).

## Task 2. Parallel Job

`parallel-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: workers
spec:
  completions: 6
  parallelism: 3
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: worker
          image: busybox
          command: ["sh", "-c", "echo worker $(hostname) start; sleep 5; echo done"]
  backoffLimit: 0
```

```bash
kubectl apply -f parallel-job.yaml
kubectl get pods -l job-name=workers -w
```

**What you'll see:** 3 pods run at once; after they finish, another 3 start, for 6 successful runs total. `kubectl get jobs` shows `6/6`.

## Task 3. A failing Job and backoffLimit

`flaky-job.yaml`:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: flaky
spec:
  backoffLimit: 3
  template:
    spec:
      restartPolicy: Never
      containers:
        - name: f
          image: busybox
          command: ["sh", "-c", "echo try; exit 1"]
```

```bash
kubectl apply -f flaky-job.yaml
kubectl get jobs flaky -w
kubectl get pods -l job-name=flaky
```

**What you'll see:** the Job creates 4 pods (1 initial + 3 retries), all fail, and the Job moves to `Failed`.

```bash
kubectl describe job flaky | tail -20
```

The events will contain `BackoffLimitExceeded`.

## Task 4. CronJob

`backup-cron.yaml`:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "*/2 * * * *"
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 2
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 0
      ttlSecondsAfterFinished: 300
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: backup
              image: busybox
              command: ["sh", "-c", "echo backup at $(date)"]
```

```bash
kubectl apply -f backup-cron.yaml
kubectl get cronjob backup
```

Wait ~2 minutes, then:

```bash
kubectl get jobs
kubectl get pods -l job-name | head
```

**What you'll see:** a Job of the form `backup-<timestamp>` appears, the pod is `Completed`, and the logs show `backup at ...`.

## Task 5. Triggering a CronJob manually

Don't want to wait for the next window? Run a Job right now:

```bash
kubectl create job manual --from=cronjob/backup
kubectl logs job/manual
```

## Task 6. concurrencyPolicy

Change the command in `backup-cron.yaml` to a long-running one:

```yaml
command: ["sh", "-c", "echo start at $(date); sleep 180; echo done"]
```

And the schedule to every minute:

```yaml
schedule: "* * * * *"
```

Apply it, wait 3 minutes, and check `kubectl get jobs`.

**What you'll see with `concurrencyPolicy: Forbid`:** exactly one Job in `Running`, and each new run every 60 seconds is **skipped**.

Change it to `concurrencyPolicy: Replace` and repeat. Now the old Job is killed and a new one takes its place. `Allow` — all Jobs run at once.

## Task 7. Experiment questions

Extend `flaky-job.yaml` so that:

1. The Job is marked `Failed` after 30 seconds regardless of the number of attempts. (Hint: `activeDeadlineSeconds`.)
2. The container restarts **inside the same pod**, without creating a new one. (Hint: `restartPolicy: OnFailure`. Which Job fields behave differently in that case?)

Compare the behavior of `Never` and `OnFailure` via `kubectl get pods -l job-name=flaky`.

## Cleanup

```bash
kubectl delete namespace lab-jobs
kubectl config set-context --current --namespace=default
```

## Self-check questions

1. What does `successfulJobsHistoryLimit` store? What happens when it's exceeded?
2. How does `restartPolicy: OnFailure` differ from `Never` for a Job?
3. What time zone does a CronJob use by default? How do you change it?
4. Why does `kubectl get pods` still show pods after a successful Job? How do you get rid of them automatically?
