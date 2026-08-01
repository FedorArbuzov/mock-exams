# 24. Lab: backup and restore via Velero

> Requires Helm and ~2 GB of free RAM. Installing Velero takes 3–5 minutes.

## Task 1. Install Velero + MinIO

```bash
velero version 2>/dev/null || echo "install velero CLI: https://velero.io/docs/main/basic-install/"
```

Download a [velero release](https://github.com/vmware-tanzu/velero/releases) for your OS.

Install via the minikube plugin (simplified):

```bash
minikube -p mock-exams addons enable volumesnapshots 2>/dev/null || true

# Official quick-start for minikube:
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.10.0 \
  --bucket velero \
  --secret-file ./credentials-velero \
  --use-volume-snapshots=false \
  --backup-location-config region=minio,s3ForcePathStyle=true,s3Url=http://min.io.velero.svc:9000
```

If you don't have credentials — use the [Velero minikube documentation](https://velero.io/docs/main/contributions/minio/) to generate `credentials-velero`.

Check:

```bash
kubectl get pods -n velero
velero version
```

## Task 2. Create a test application

```bash
kubectl create namespace app-velero
kubectl create deployment web -n app-velero --image=nginx:1.27-alpine --replicas=2
kubectl create configmap marker -n app-velero --from-literal=backup-test=yes
kubectl get all,cm -n app-velero
```

## Task 3. Backup

```bash
velero backup create app-velero-backup --include-namespaces app-velero --wait
velero backup describe app-velero-backup | head -30
```

**What you'll see:** `Phase: Completed`, `Items backed up: N`.

## Task 4. Delete the namespace

```bash
kubectl delete namespace app-velero
kubectl get ns app-velero 2>&1
```

## Task 5. Restore

```bash
velero restore create app-velero-restore --from-backup app-velero-backup --wait
velero restore describe app-velero-restore
kubectl get all,cm -n app-velero
```

**What you'll see:** the Deployment, pods, and ConfigMap `marker` restored.

## Task 6. Schedule (optional)

```bash
velero schedule create hourly --schedule="@every 1h" --include-namespaces app-velero
velero schedule get
```

## Cleanup

```bash
kubectl delete namespace app-velero velero --ignore-not-found
# velero uninstall (if you installed via velero install):
velero uninstall --wait
```

## Self-check questions

1. What does Velero save to S3/MinIO?
2. How does a restore differ from a repeated `kubectl apply`?
3. Why `--wait` on backup/restore?
