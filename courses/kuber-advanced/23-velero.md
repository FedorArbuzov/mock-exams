# 23. Velero: backup namespace и restore

## Зачем Velero, если есть etcd backup

| | etcd snapshot | Velero |
|---|---|---|
| Что бэкапит | Все объекты API | Объекты + **данные PV** (опционально) |
| Гранулярность | Весь кластер | Namespace, label selector |
| Restore | Весь кластер | Выборочно |
| PV data | Нет | Да (через restic/kopia) |

Для приложений с БД нужен **Velero** (или vendor backup). etcd — для disaster recovery control plane.

## Архитектура

```text
Velero server (pod в кластере)
    │
    ├── Backup: объекты → S3/MinIO (via BackupStorageLocation)
    └── PV snapshots → cloud disk API (или restic file-level backup)
```

На minikube: **MinIO** в кластере как S3-совместимое хранилище.

## Установка (обзор)

```bash
helm repo add vmware-tanzu https://vmware-tanzu.github.io/helm-charts
helm install velero vmware-tanzu/velero \
  --namespace velero --create-namespace \
  --set configuration.backupStorageLocation[0].bucket=velero \
  --set configuration.backupStorageLocation[0].provider=aws \
  ...
```

В лабе [24-lab-velero.md](24-lab-velero.md) — готовые команды.

## Backup

```bash
# Весь namespace:
velero backup create app-backup --include-namespaces app-prod

# С label selector:
velero backup create web-backup --selector app=web

# По расписанию (Schedule):
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

Restore создаёт объекты заново. Конфликты (уже есть Deployment с тем же именем) — ошибки в restore log.

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

## Что Velero не делает

- Не бэкапит etcd (это отдельно).
- Не заменяет DR между регионами без настройки.
- Cross-cluster restore требует совместимых StorageClass.

## Чек-лист CKA-adjacent

- Чем Velero отличается от etcd snapshot?
- Как сделать backup одного namespace?
- Как восстановить из backup?
- Зачем MinIO в minikube?

Лаба: [24-lab-velero.md](24-lab-velero.md).
