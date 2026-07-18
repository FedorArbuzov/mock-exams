# 04. Лаба: PVC, retention, расширение

Цель — увидеть жизненный цикл PVC/PV руками.

## Подготовка

```bash
kubectl create namespace lab-pv
kubectl config set-context --current --namespace=lab-pv
kubectl get sc                # default должен быть 'standard'
```

## Задание 1. Создать PVC

`pvc.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data
spec:
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 200Mi
```

```bash
kubectl apply -f pvc.yaml
kubectl get pvc                # ожидаем Status: Bound
kubectl get pv | head
```

**Что увидите:** PVC `data` стал Bound, появился PV `pvc-<UID>` с capacity 200Mi.

## Задание 2. Записать данные

`writer.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: writer
spec:
  restartPolicy: Never
  containers:
    - name: w
      image: busybox
      command: ["sh", "-c", "date > /data/start.txt && sleep 3600"]
      volumeMounts:
        - name: d
          mountPath: /data
  volumes:
    - name: d
      persistentVolumeClaim:
        claimName: data
```

```bash
kubectl apply -f writer.yaml
kubectl exec writer -- cat /data/start.txt
```

## Задание 3. Удалить под, не удалить PVC

```bash
kubectl delete pod writer
kubectl get pvc                # data всё ещё Bound
```

Поднимем под `reader`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: reader
spec:
  restartPolicy: Never
  containers:
    - name: r
      image: busybox
      command: ["sh", "-c", "cat /data/start.txt && sleep 3600"]
      volumeMounts:
        - name: d
          mountPath: /data
  volumes:
    - name: d
      persistentVolumeClaim:
        claimName: data
```

```bash
kubectl apply -f reader.yaml
kubectl logs reader
```

**Что увидите:** ту же дату, что записал предыдущий под. Это и есть «персистентность поверх жизни пода».

## Задание 4. StorageClass с reclaim=Retain

`sc-retain.yaml`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: keep
provisioner: k8s.io/minikube-hostpath
reclaimPolicy: Retain
volumeBindingMode: Immediate
```

`pvc-retain.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: keep-data
spec:
  storageClassName: keep
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 100Mi
```

```bash
kubectl apply -f sc-retain.yaml
kubectl apply -f pvc-retain.yaml
kubectl get pvc
kubectl get pv -o wide
```

Удалите PVC и **посмотрите, что станет с PV**:

```bash
PV=$(kubectl get pvc keep-data -o jsonpath='{.spec.volumeName}')
kubectl delete pvc keep-data
kubectl get pv "$PV"
```

**Что увидите:** PV перешёл в `Released`, **не удалён**. На реальном облаке данные на диске остались бы.

Удалите его руками, когда не нужны:

```bash
kubectl delete pv "$PV"
```

## Задание 5 (опционально). Расширение PVC

Default StorageClass minikube **поддерживает** `allowVolumeExpansion`. Проверьте:

```bash
kubectl get sc standard -o jsonpath='{.allowVolumeExpansion}'
```

Если `true`, попробуйте:

```bash
kubectl patch pvc data -p '{"spec":{"resources":{"requests":{"storage":"500Mi"}}}}'
kubectl get pvc data
kubectl describe pvc data | head -30
```

**Что должно измениться:** capacity вырастет до 500Mi (на minikube hostpath это формальность — реально диск общий с нодой; но event про изменение увидите).

Если `false` — пропустите задание; на реальных облачных классах это работает прозрачно для пода.

## Задание 6. WaitForFirstConsumer

Создайте StorageClass с `volumeBindingMode: WaitForFirstConsumer` и PVC к нему:

`sc-wait.yaml`:

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: wait-sc
provisioner: k8s.io/minikube-hostpath
volumeBindingMode: WaitForFirstConsumer
```

`pvc-wait.yaml`:

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: wait-data
spec:
  storageClassName: wait-sc
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 50Mi
```

```bash
kubectl apply -f sc-wait.yaml -f pvc-wait.yaml
kubectl get pvc wait-data
```

**Что увидите:** PVC в статусе `Pending` с сообщением `waiting for first consumer to be created before binding`. PV ещё нет.

Создайте под:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: consumer
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sh", "-c", "sleep 3600"]
      volumeMounts:
        - name: d
          mountPath: /data
  volumes:
    - name: d
      persistentVolumeClaim:
        claimName: wait-data
```

```bash
kubectl apply -f consumer.yaml
kubectl get pvc wait-data -w
```

**Что увидите:** теперь PVC переходит в `Bound`. PV создаётся **по факту появления потребителя**.

## Уборка

```bash
kubectl delete namespace lab-pv
kubectl delete sc keep wait-sc
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. Что произойдёт с PVC, если удалить только под, использующий его?
2. В чём разница между `Delete` и `Retain` reclaim policy на практике?
3. Зачем нужен `WaitForFirstConsumer`? Какую проблему он решает в multi-zone-кластерах?
4. Может ли один PVC одновременно использоваться двумя подами в режиме `ReadWriteOnce`?
5. Как увеличить размер PVC, если StorageClass это поддерживает?
