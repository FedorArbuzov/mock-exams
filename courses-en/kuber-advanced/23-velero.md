# 23. Velero: namespace backup and restore

## Why Velero if you already have etcd backup

| | etcd snapshot | Velero |
|---|---|---|
| What it backs up | All API objects | Objects + **PV data** (optional) |
| Granularity | The whole cluster | Namespace, label selector |
| Restore | The whole cluster | Selectively |
| PV data | No | Yes (via restic/kopia) |

For applications with a database you need **Velero** (or a vendor backup). etcd — for control plane disaster recovery.

## Architecture

```text
Velero server (a pod in the cluster)
    │
    ├── Backup: objects → S3/MinIO (via BackupStorageLocation)
    └── PV snapshots → cloud disk API (or restic file-level backup)
```

On minikube: **MinIO** in the cluster as S3-compatible storage.

## Installation (overview)

```bash
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm install velero vmware-tanzu/velero \
  --namespace velero --create-namespace \
  --set configuration.backupStorageLocation[0].bucket=velero \
  --set configuration.backupStorageLocation[0].provider=aws \
  ...
```

Ready-made commands in the [24-lab-velero.md](24-lab-velero.md) lab.

## Backup

```bash
# The whole namespace:
velero backup create app-backup --include-namespaces app-prod

# With a label selector:
velero backup create web-backup --selector app=web

# On a schedule (Schedule):
velero schedule create daily --schedule="0 2 * * *" \
  --include-namespaces app-prod
```

```bash
velero backup get
velero backup describe app-backup
velero backup logs app-backup
```

## Restore

```bash
velero restore create --from-backup app-backup
velero restore get
velero restore describe <name>
```

A restore recreates the objects. Conflicts (a Deployment with the same name already exists) — errors in the restore log.

## BackupStorageLocation

```yaml
apiVersion: velero.io/v1
kind: BackupStorageLocation
metadata:
  name: default
  namespace: velero
spec:
  provider: aws
  objectStorage:
    bucket: velero
  config:
    region: minio
    s3ForcePathStyle: "true"
    s3Url: http://minio.velero.svc:9000
```

## What Velero doesn't do

- Doesn't back up etcd (that's separate).
- Doesn't replace cross-region DR without configuration.
- Cross-cluster restore requires compatible StorageClasses.

## CKA-adjacent checklist

- How does Velero differ from an etcd snapshot?
- How do you back up a single namespace?
- How do you restore from a backup?
- Why MinIO in minikube?

Lab: [24-lab-velero.md](24-lab-velero.md).
