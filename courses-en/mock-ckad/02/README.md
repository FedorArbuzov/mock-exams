# Mock CKAD — Run 02

**Level:** medium. **Time:** 120 minutes. **Topics:** Probes, Resources, Init / Sidecar, Job, CronJob, Volumes (PVC, emptyDir).

## Preparation

```bash
mockctl up
bash courses/mock-ckad/02/prepare.sh
```

`prepare.sh` will create namespaces `dev`, `batch` and set up a «broken» application `flaky` in `dev` (for Q1).

## Tasks

### Q1. Probes for a «broken» application

In namespace `dev` there is already a deployment `flaky` (the container becomes ready 20 seconds after start, after which it stably answers `/healthz`).

Right now the pod restarts every 10 seconds because there are no correct probes. Fix the deployment so the pod becomes `Ready` without restarts:

- add a `startupProbe` that waits long enough for readiness;
- add a `readinessProbe` and a `livenessProbe` that do **not** kill the already-ready pod.

All probes — HTTP `/healthz` on port 8080.

### Q2. Resources and QoS

In namespace `dev` create a deployment `cpu-hog`:

- image `polinux/stress`;
- runs `stress --cpu 1`;
- requests: `cpu=100m`, `memory=64Mi`;
- limits: `cpu=200m`, `memory=128Mi`.

The QoS class of this pod must come out as `Burstable` (checked automatically).

### Q3. Init container

In namespace `dev` create a deployment `web-with-config`:

- main container: `nginx:1.27-alpine`, serves `/usr/share/nginx/html/`;
- init container: `busybox`, runs `sh -c 'echo "<h1>hello $(date)</h1>" > /work/index.html'`;
- a shared `emptyDir` volume mounted in init as `/work`, and in the main container as `/usr/share/nginx/html`;
- 1 replica.

### Q4. Sidecar logger

Into the same deployment `web-with-config` (Q3) add a sidecar container `log-tailer`:

- image `busybox`;
- command: `sh -c 'tail -F /var/log/nginx/access.log'`;
- a shared emptyDir volume `logs`, mounted in the main container as `/var/log/nginx`, and in the sidecar as `/var/log/nginx`.

### Q5. Job

In namespace `batch` create a Job `migrate`:

- image `busybox`;
- command: `sh -c 'echo migrating && sleep 5 && echo done'`;
- restartPolicy: `Never`;
- backoffLimit: `2`;
- parallelism: `1`, completions: `1`.

After a successful finish it should remain completed (status `Complete`).

### Q6. CronJob

In namespace `batch` create a CronJob `cleanup`:

- schedule: every 2 minutes (`*/2 * * * *`);
- image `busybox`;
- command: `sh -c 'echo cleanup at $(date)'`;
- keeps at most 3 successful and 1 failed history entries.

### Q7. PVC for persistent data

In namespace `dev` create:

- PVC `data` of `100Mi`, `ReadWriteOnce`, defaultStorageClass;
- pod `data-writer` on image `busybox` that writes `hello` to `/data/file.txt` and keeps the container alive: `sh -c 'echo hello > /data/file.txt && sleep 3600'`;
- the PVC volume `data` mounted at `/data`.

Check: `kubectl exec data-writer -n dev -- cat /data/file.txt` returns `hello`.

### Q8. Lifecycle: graceful shutdown

In namespace `dev` create a deployment `graceful`:

- image `nginx:1.27-alpine`, 1 replica;
- `terminationGracePeriodSeconds: 60`;
- a preStop hook running `sleep 15` (so the pod can finish reading requests before shutdown).

## Verification

```bash
bash courses/mock-ckad/02/verify.sh
```

8 questions; to «pass» you need at least 6.

## Cleanup

```bash
kubectl delete ns dev batch
```

## After your attempt

Open [`solution.md`](solution.md).
