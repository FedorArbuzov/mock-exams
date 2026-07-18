# 24. Лаба: backup и restore через Velero

> Требует Helm и ~2 ГБ свободной RAM. Установка Velero занимает 3–5 минут.

## Задание 1. Установить Velero + MinIO

```bash
velero version 2>/dev/null || echo "install velero CLI: https://velero.io/docs/main/basic-install/"
```

Скачайте [velero release](https://github.com/vmware-tanzu/velero/releases) для вашей ОС.

Установка через плагин minikube (упрощённо):

```bash
minikube -p mock-exams addons enable volumesnapshots 2>/dev/null || true

# Официальный quick-start для minikube:
velero install \
  --provider aws \
  --plugins velero/velero-plugin-for-aws:v1.10.0 \
  --bucket velero \
  --secret-file ./credentials-velero \
  --use-volume-snapshots=false \
  --backup-location-config region=minio,s3ForcePathStyle=true,s3Url=http://min.io.velero.svc:9000
```

Если нет credentials — используйте [документацию Velero minikube](https://velero.io/docs/main/contributions/minio/) для генерации `credentials-velero`.

Проверка:

```bash
kubectl get pods -n velero
velero version
```

## Задание 2. Создать тестовое приложение

```bash
kubectl create namespace app-velero
kubectl create deployment web -n app-velero --image=nginx:1.27-alpine --replicas=2
kubectl create configmap marker -n app-velero --from-literal=backup-test=yes
kubectl get all,cm -n app-velero
```

## Задание 3. Backup

```bash
velero backup create app-velero-backup --include-namespaces app-velero --wait
velero backup describe app-velero-backup | head -30
```

**Что увидите:** `Phase: Completed`, `Items backed up: N`.

## Задание 4. Удалить namespace

```bash
kubectl delete namespace app-velero
kubectl get ns app-velero 2>&1
```

## Задание 5. Restore

```bash
velero restore create app-velero-restore --from-backup app-velero-backup --wait
velero restore describe app-velero-restore
kubectl get all,cm -n app-velero
```

**Что увидите:** Deployment, pods, ConfigMap `marker` восстановлены.

## Задание 6. Schedule (опционально)

```bash
velero schedule create hourly --schedule="@every 1h" --include-namespaces app-velero
velero schedule get
```

## Уборка

```bash
kubectl delete namespace app-velero velero --ignore-not-found
# velero uninstall (если ставили через velero install):
velero uninstall --wait
```

## Вопросы для самопроверки

1. Что Velero сохраняет в S3/MinIO?
2. Чем restore отличается от повторного `kubectl apply`?
3. Зачем `--wait` на backup/restore?
