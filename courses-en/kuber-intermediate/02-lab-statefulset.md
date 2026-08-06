# 02. Lab: StatefulSet with Postgres

The goal is to bring up Postgres as a StatefulSet, see stable names and volumes, and verify that data **survives** pod deletion.

You'll need: Docker Desktop Kubernetes ready (`kubectl config use-context docker-desktop`, nodes Ready). See [ENVIRONMENT.md](ENVIRONMENT.md).

## Setup

Let's create a namespace and make it the current one:

```bash
kubectl create namespace lab-sts
kubectl config set-context --current --namespace=lab-sts
```

## Task 1. Headless Service

Create the file `db-svc.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: db
spec:
  clusterIP: None
  selector:
    app: db
  ports:
    - port: 5432
      targetPort: 5432
```

Apply it:

```bash
kubectl apply -f db-svc.yaml
kubectl get svc db
```

**What you'll see:** `CLUSTER-IP = None`. That's what makes it headless.

## Task 2. Secret with the password

To avoid hardcoding the password into YAML:

```bash
kubectl create secret generic db-credentials \
  --from-literal=POSTGRES_PASSWORD='S3cretP@ss'
```

Verification:

```bash
kubectl get secret db-credentials -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d
```

It should return `S3cretP@ss`.

## Task 3. StatefulSet with 3 replicas

File `db-sts.yaml`:

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: db
spec:
  serviceName: db
  replicas: 3
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      terminationGracePeriodSeconds: 10
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
              name: pg
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: POSTGRES_PASSWORD
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: data
              mountPath: /var/lib/postgresql/data
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "postgres"]
            initialDelaySeconds: 5
            periodSeconds: 5
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: [ReadWriteOnce]
        resources:
          requests:
            storage: 500Mi
```

Apply it and **watch the startup order**:

```bash
kubectl apply -f db-sts.yaml
kubectl get pods -l app=db -w
```

**What you should see:** `db-0` comes up, becomes `Ready`, and **only then** does `db-1` appear, and so on. You can stop watching with `Ctrl+C` after `db-2 1/1 Running`.

## Task 4. Stable names and DNS

Run a temporary pod and reach the pods by name from inside it:

```bash
kubectl run dnstest --rm -it --image=busybox -- sh
```

Inside:

```sh
nslookup db
nslookup db-0.db
nslookup db-1.db
nslookup db-2.db
exit
```

**What you'll see:**

- `nslookup db` → 3 IPs in the response (one record per pod).
- `nslookup db-0.db` → exactly one IP (the address of db-0).
- The IP addresses can be cross-checked with `kubectl get pods -l app=db -o wide`.

## Task 5. PVCs and stable storage

Look at the volumes:

```bash
kubectl get pvc
```

There should be three PVCs: `data-db-0`, `data-db-1`, `data-db-2`. All `Bound`.

Create a table and a row in `db-0`:

```bash
kubectl exec -it db-0 -- psql -U postgres -c "CREATE TABLE notes(id serial primary key, txt text);"
kubectl exec -it db-0 -- psql -U postgres -c "INSERT INTO notes(txt) VALUES ('hello from db-0');"
kubectl exec -it db-0 -- psql -U postgres -c "SELECT * FROM notes;"
```

**What you'll see:** the row `hello from db-0`.

Now brutally delete the pod:

```bash
kubectl delete pod db-0
```

Verify that k8s recreates it **with the same name** and **with the same PVC**:

```bash
kubectl get pods -l app=db -w
# wait for db-0 1/1 Running
kubectl exec -it db-0 -- psql -U postgres -c "SELECT * FROM notes;"
```

**What should remain:** the row `hello from db-0` — the data survived the restart. That's "stable storage".

## Task 6. Scale down doesn't lose volumes

Scale down to 2 replicas:

```bash
kubectl scale sts db --replicas=2
kubectl get pods -l app=db
kubectl get pvc
```

**What you'll see:** pod `db-2` is gone, but the PVC `data-db-2` remains. The data on it is preserved, it's just that nobody is connected to it right now.

Scale back to 3 replicas:

```bash
kubectl scale sts db --replicas=3
kubectl get pods -l app=db
```

Pod `db-2` comes up and **reattaches its old PVC**. This behavior is exactly what matters for databases.

## Task 7. Stop order

Start a watcher terminal in one tab:

```bash
kubectl get pods -l app=db -w
```

In another tab, delete the StatefulSet while **keeping** the Service and PVCs:

```bash
kubectl delete sts db
```

**What you'll see:** pods are terminated **in reverse order**: `db-2`, then `db-1`, then `db-0`.

Verify the PVCs are still there:

```bash
kubectl get pvc
```

Apply the StatefulSet again:

```bash
kubectl apply -f db-sts.yaml
kubectl get pods -l app=db -w
```

The pods come back up, reattach their PVCs — and `kubectl exec db-0 -- psql -U postgres -c "SELECT * FROM notes;"` again shows `hello from db-0`. The state was fully restored.

## Task 8 (bonus). Connect to a specific pod by name

Create a temporary pod with psql and connect explicitly to `db-1`:

```bash
kubectl run pgcli --rm -it --image=postgres:16-alpine --env=PGPASSWORD=S3cretP@ss -- \
  psql -h db-1.db -U postgres -c "SELECT inet_server_addr(), inet_server_port();"
```

**What you'll see:** a row with the IP address of pod `db-1` and port `5432`. This only works thanks to headless DNS.

## Cleanup

```bash
kubectl delete sts db 2>/dev/null
kubectl delete svc db
kubectl delete secret db-credentials
kubectl delete pvc -l app=db        # explicitly remove PVCs
kubectl delete namespace lab-sts
kubectl config set-context --current --namespace=default
```

(`-l app=db` only works if the template set a label on the PVC — in most cases it doesn't; in that case delete by name: `kubectl delete pvc data-db-0 data-db-1 data-db-2`.)

## Self-check questions

1. Why does a StatefulSet need `serviceName` in its spec if the service is a separate object anyway?
2. Why `clusterIP: None`? What would happen to DNS if it were `clusterIP: 10.0.0.42`?
3. What happens to the PVC `data-db-0` if you run `kubectl delete sts db` without any flags?
4. In what order do pods stop on `kubectl scale sts db --replicas=0`?
5. How do you do a "canary" upgrade of only pod `db-2` without touching the others?

Answers are in the [theory](01-statefulset.md), especially the sections on `volumeClaimTemplates`, `partition`, and DNS.

## What's next

The next lab is [03-persistent-volumes.md](03-persistent-volumes.md): we'll dig deeper into PV/PVC/StorageClass and experiment with the retention policy.
