# 08. Lab: package a demo application into a Helm chart

## Setup

```bash
helm version
kubectl create namespace lab-helm
kubectl config set-context --current --namespace=lab-helm
```

## Task 1. Generate a chart

```bash
mkdir -p ~/mychart-work && cd ~/mychart-work
helm create demo
ls -R demo
```

**What you got:** the default nginx chart. `values.yaml` already has `replicaCount`, `image`, `service`, `ingress`.

## Task 2. Install into the namespace

```bash
helm install d1 ./demo
helm list
kubectl get pods,svc -l app.kubernetes.io/instance=d1
```

**What you'll see:** a pod and a Service. The chart "as is" uses nginx.

## Task 3. Your own values

Create `dev-values.yaml`:

```yaml
replicaCount: 3
image:
  repository: nginx
  tag: 1.27-alpine
  pullPolicy: IfNotPresent
service:
  type: ClusterIP
  port: 80
```

```bash
helm upgrade d1 ./demo -f dev-values.yaml
kubectl get pods -l app.kubernetes.io/instance=d1
```

**What you'll see:** there are now 3 replicas, and the image was updated.

## Task 4. Install a second time with a different name

```bash
helm install d2 ./demo --set replicaCount=1
helm list
```

**What you'll see:** two releases of the same chart (`d1` and `d2`) live in parallel, each with its own pods.

## Task 5. Render templates without installing

```bash
helm template d3 ./demo --set replicaCount=5 | head -50
```

**What you'll see:** the ready YAML in stdout. No objects are created in the cluster.

## Task 6. History and rollback

Change the image version in `dev-values.yaml`:

```yaml
image:
  tag: 1.28-alpine
```

```bash
helm upgrade d1 ./demo -f dev-values.yaml
helm history d1
```

**What you'll see:** there are two revisions (1 and 2).

Rollback:

```bash
helm rollback d1 1
helm history d1
```

**What should happen:** a third revision appears — a rollback is always an "applied rollback", not a "rollback erases history".

## Task 7. A ready-made chart from a registry — Postgres

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgresql --versions | head
```

Install Postgres with minimal parameters:

```bash
helm install pg bitnami/postgresql \
  --set auth.postgresPassword='S3cretP@ss' \
  --set primary.persistence.size=200Mi
kubectl get all -l app.kubernetes.io/instance=pg
kubectl get pvc -l app.kubernetes.io/instance=pg
```

**What you'll see:** a StatefulSet `pg-postgresql`, a pod `pg-postgresql-0`, a Service, and a PVC. Helm deployed a production-grade stack with a single command.

Connect:

```bash
kubectl run pgcli --rm -it --image=bitnami/postgresql:16 \
  --env=PGPASSWORD='S3cretP@ss' -- \
  psql -h pg-postgresql -U postgres -c "SELECT version();"
```

## Task 8. helm template for auditing

The full YAML that Helm deployed for `pg`:

```bash
helm get manifest pg | head -100
helm get values pg
```

**What they'll show:** all the objects as they currently look in the cluster, and which values were applied.

## Cleanup

```bash
helm uninstall d1 d2 pg
kubectl delete namespace lab-helm
kubectl config set-context --current --namespace=default
```

(`helm uninstall` deletes all of the release's objects itself, but **does not delete PVCs** — that's the default behavior for StatefulSet. PVCs must be deleted manually if you no longer need them.)

## Self-check questions

1. What happens if you install the same chart twice with different release names?
2. Where does Helm store the release history and how do you view it?
3. How is `helm upgrade --install` more convenient than doing it separately?
4. How do you see what YAML Helm will apply **before** the actual apply?
5. Why do PVCs remain after `helm uninstall`, and what do you do with them?
