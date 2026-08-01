# 05. Job and CronJob

## Why

`Deployment` is designed for **long-lived** processes: "always keep N pods running". Sometimes you need the opposite — **do the work once and finish**:

- a DB migration on release;
- a backup at night;
- processing a batch of files;
- generating a report.

For this there's **Job** (a one-off task) and **CronJob** (a Job on a schedule).

## Minimal Job

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
          command: ["sh", "-c", "echo hello && sleep 5 && echo done"]
  backoffLimit: 4
```

```bash
kubectl apply -f hello.yaml
kubectl get jobs
kubectl get pods -l job-name=hello
kubectl logs job/hello
```

After success the Job moves to `Completed`, and the pod lives on in `Completed` status. It isn't "cleaned up" — that's intentional, so you can look at the logs.

Delete it:

```bash
kubectl delete job hello
```

## Fields worth knowing

```yaml
spec:
  completions: 5         # how many pods must complete successfully
  parallelism: 2         # how many at once
  backoffLimit: 6        # how many times to retry a failed pod before FAIL
  activeDeadlineSeconds: 600   # overall timeout for the whole Job
  ttlSecondsAfterFinished: 300 # auto-delete the Job N sec after completion
```

- `completions: N` — the task is considered done after N successful pods.
- `parallelism: M` — bring up no more than M at once.
- Combination: `completions=10, parallelism=3` — process 10 "units", 3 in parallel.
- `backoffLimit` — how many failed attempts are allowed. Default is 6.
- `activeDeadlineSeconds` — a global timer. Exceed it and the Job is marked `Failed`.
- `ttlSecondsAfterFinished` — auto-cleanup. Without it, Jobs pile up.

## restartPolicy and failure behavior

Inside `template.spec`, only `Never` or `OnFailure` are allowed for a Job:

- `Never` — a failed pod counts as a "failed attempt", and the Job creates a **new** pod (up to `backoffLimit`).
- `OnFailure` — kubelet restarts the container **inside the same pod**, without creating a new one.

`OnFailure` gives a slightly faster restart (no new pod creation and image pull), but it's harder to recover the logs. Usually you go with `Never`.

## CronJob

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "*/5 * * * *"           # every 5 minutes
  concurrencyPolicy: Forbid
  successfulJobsHistoryLimit: 3
  failedJobsHistoryLimit: 1
  jobTemplate:
    spec:
      backoffLimit: 0
      template:
        spec:
          restartPolicy: Never
          containers:
            - name: backup
              image: busybox
              command: ["sh", "-c", "echo backup at $(date)"]
```

Fields:

- `schedule` — standard cron format (5 fields: minute hour day month day-of-week). You can use aliases: `@hourly`, `@daily`, `@weekly`.
- `concurrencyPolicy`:
  - `Allow` (default) — a new run can start even if the old one is still running.
  - `Forbid` — skip the run if the old one is still running.
  - `Replace` — kill the old one, start a new one.
- `successfulJobsHistoryLimit`, `failedJobsHistoryLimit` — how many recent Jobs to keep. Without them, old Jobs pile up.
- `startingDeadlineSeconds` — if k8s "overslept" the run window (for example, it was overloaded), whether to run or not.
- `suspend: true` — pause the schedule without deleting the CronJob.

## Time zone

CronJob uses **UTC** by default. If you need 02:00 in local time, either compute the offset in `schedule`, or, starting from k8s 1.27, specify:

```yaml
spec:
  timeZone: "Europe/Moscow"
```

## Useful commands

```bash
kubectl get jobs
kubectl get cronjobs
kubectl get pods -l job-name=hello
kubectl logs job/hello
kubectl describe job hello

# Trigger a CronJob right now, without waiting for the schedule:
kubectl create job manual --from=cronjob/backup
```

## When to use what

- **Job** — a DB migration on deploy; a one-off task doesn't fit an init container (init containers run on every pod start).
- **CronJob** — backups, reports, log cleanup, cache rotation.
- **Deployment** — for "always running" services.

## Checklist

- What happens if a container fails in a Job with `restartPolicy: Never` and `backoffLimit: 3`?
- Why do you need `ttlSecondsAfterFinished`?
- How do you make it "don't start a new backup if the old one is still running"?
- Why does a CronJob need `successfulJobsHistoryLimit`?
