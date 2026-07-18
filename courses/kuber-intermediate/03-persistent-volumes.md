# 03. Persistent Volumes: PV / PVC / StorageClass

## Зачем

Контейнеры эфемерны: убил под — потерял всё на его файловой системе. Чтобы данные пережили рестарт пода (а тем более ребут ноды), нужен **внешний** диск. В Kubernetes за это отвечают три объекта:

- **PersistentVolume (PV)** — реально существующий диск (на ноде, в облаке, в SAN). Отдельный объект уровня кластера.
- **PersistentVolumeClaim (PVC)** — «заявка» от пода: «дайте мне диск на 1 ГБ, ReadWriteOnce». Объект внутри namespace.
- **StorageClass** — описание «как и где создавать новые PV» по требованию (dynamic provisioning).

Поток обычно такой:

```text
Pod  →  PVC  →  StorageClass  →  (provisioner создаёт)  →  PV
```

## Static vs Dynamic provisioning

**Static.** Админ заранее создаёт PV, пользователи через PVC «заявляют» нужный размер, k8s связывает (binds) подходящий PV с PVC. Ручной труд, редко используется.

**Dynamic.** PVC указывает StorageClass; provisioner (плагин этого StorageClass) **сам** создаёт PV нужного размера. Это поведение по умолчанию во всех современных кластерах, включая minikube.

В minikube есть default StorageClass с именем `standard`:

```bash
kubectl get sc
# NAME                 PROVISIONER                RECLAIMPOLICY   ...
# standard (default)   k8s.io/minikube-hostpath   Delete          ...
```

Если PVC не указывает `storageClassName`, берётся default.

## Минимальный PVC

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 1Gi
```

После `kubectl apply`:

1. K8s видит PVC без явного `storageClassName` → берёт default (`standard`).
2. Provisioner `minikube-hostpath` создаёт PV.
3. PV и PVC связываются (`Bound`).
4. Любой под, у которого `volumes[].persistentVolumeClaim.claimName: data`, получит этот диск.

## Access modes

В `accessModes` указывают, как том может быть смонтирован:

- `ReadWriteOnce` (RWO) — один узел может монтировать read/write. Для local-storage и большинства облачных дисков (EBS, GCE PD).
- `ReadOnlyMany` (ROX) — много узлов read-only.
- `ReadWriteMany` (RWX) — много узлов read/write. Только NFS/CephFS/EFS и подобное.
- `ReadWriteOncePod` (RWOP, k8s 1.27+) — RW для **одного пода**, не узла.

В minikube hostpath реально поддерживается только RWO. Это нормально для обучения.

## Reclaim policy

`reclaimPolicy` PV определяет, что произойдёт после удаления PVC:

- `Delete` — provisioner удаляет реальный диск. Это default для большинства классов и для `standard` в minikube.
- `Retain` — PV остаётся, диск не трогается. Можно потом «переиспользовать», если знаешь как (вручную пометить `Available`).
- `Recycle` — устаревшее, не используем.

Чтобы менять политику для конкретных PVC — создавайте отдельный StorageClass с `reclaimPolicy: Retain`.

## Связь с подами

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: writer
spec:
  containers:
    - name: app
      image: busybox
      command: ["sh", "-c", "echo hello > /data/file && sleep 3600"]
      volumeMounts:
        - name: storage
          mountPath: /data
  volumes:
    - name: storage
      persistentVolumeClaim:
        claimName: data
```

Pod → монтирует PVC `data` в `/data`. Если под перезапустится — диск переподключится, файл `/data/file` останется.

## Жизненный цикл — наглядно

```text
[нет ничего]
    │  kubectl apply -f pvc.yaml
    ▼
PVC: Pending
    │  provisioner создал PV
    ▼
PVC: Bound  ←→  PV: Bound
    │  pod использует pvc, пишет данные
    ▼
PVC: Bound (данные на диске)
    │  kubectl delete pod  → PVC жив
    ▼
PVC: Bound  (можно создать новый под и подцепить)
    │  kubectl delete pvc
    ▼
если reclaim=Delete: PV удалён, диск удалён
если reclaim=Retain: PV остался в статусе Released
```

## StorageClass подробнее

Минимальный пример:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-ssd
provisioner: k8s.io/minikube-hostpath
reclaimPolicy: Retain
volumeBindingMode: WaitForFirstConsumer
```

Поля:

- `provisioner` — кто создаёт PV (плагин, типа `kubernetes.io/aws-ebs`, `csi.driver.x`).
- `reclaimPolicy` — `Delete` или `Retain` (про новые PV).
- `volumeBindingMode`:
  - `Immediate` — создавать PV сразу как только появляется PVC.
  - `WaitForFirstConsumer` — ждать пока появится под, который этот PVC использует. Полезно для облачных дисков, которые «привязаны» к конкретной зоне доступности — тогда диск создастся в той же зоне, где будет под.
- `allowVolumeExpansion: true` — разрешает увеличивать размер PVC после создания.
- `parameters: { ... }` — параметры, специфичные для provisioner-а (тип диска, IOPS и т.п.).

## Изменение размера PVC

Если StorageClass поддерживает (`allowVolumeExpansion: true`) и provisioner это умеет:

```bash
kubectl patch pvc data -p '{"spec":{"resources":{"requests":{"storage":"2Gi"}}}}'
```

PV увеличивается онлайн. Уменьшать большинство provisioner-ов **не умеют**.

## Полезные команды

```bash
kubectl get pvc                       # PVC в текущем namespace
kubectl get pv                        # PV (cluster-wide)
kubectl describe pvc data
kubectl get sc                        # StorageClass
kubectl get pvc data -o yaml          # увидеть боунд PV
kubectl get pv pvc-... -o yaml        # путь на ноде, размер
```

Полезно подсмотреть, где именно в minikube живут данные:

```bash
minikube -p mock-exams ssh -- ls /tmp/hostpath-provisioner/
```

## Чек-лист

- Чем PV отличается от PVC «по уровню».
- Что произойдёт с PVC при `kubectl delete pod`.
- Что произойдёт с PV при `kubectl delete pvc`, если reclaimPolicy = `Delete`. А если `Retain`?
- Когда стоит выбрать `volumeBindingMode: WaitForFirstConsumer`.
- Зачем нужно `accessModes: [ReadWriteOnce]` и почему его недостаточно для «общего диска» между подами.

В лабе [04-lab-persistent-volumes.md](04-lab-persistent-volumes.md) поэкспериментируем с PVC, политиками и расширением.
