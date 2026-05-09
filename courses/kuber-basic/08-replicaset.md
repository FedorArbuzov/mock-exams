# 8. ReplicaSet

## Что это

**ReplicaSet (RS)** — контроллер, который **держит заданное число одинаковых Pod**. Если Pod падает или удалён — RS создаёт новый. Если их больше, чем нужно — лишние удаляются.

Главные поля:

- **`replicas`** — сколько подов должно быть.
- **`selector`** — по каким меткам RS «считает свои» поды.
- **`template`** — шаблон Pod (точно такой же, как в обычном Pod-манифесте, но без `kind: Pod`).

## Минимальный пример

```yaml
apiVersion: apps/v1
kind: ReplicaSet
metadata:
  name: web-rs
  labels:
    app: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
        - name: nginx
          image: nginx:1.27
          ports:
            - containerPort: 80
```

Применить:

```bash
kubectl apply -f rs.yaml
kubectl get rs
kubectl get pods -l app=web
```

## Как RS «находит свои» поды

По **selector**. Все поды в кластере, у которых метки **подходят под `matchLabels`**, считаются принадлежащими RS — даже если вы их создали отдельно.

Поэтому **labels в `selector` и `template.metadata.labels` должны совпадать.** Иначе кластер будет «крутить» бесконечно лишние поды или ругаться.

## Что умеет ReplicaSet

- Поддерживать число подов: `kubectl scale rs/web-rs --replicas=5`.
- Самовосстановление: удалите один из подов — RS создаст замену.

## Чего ReplicaSet **не** умеет

- **Не умеет обновлять образ контейнеров плавно.** Если поменять `template.spec.containers[].image`, RS **не сделает rolling update**. Это умеет **Deployment**.
- В реальной жизни **руками RS почти не пишут** — пишут Deployment, а он сам управляет ReplicaSet.

## Полезные команды

```bash
kubectl get rs
kubectl describe rs web-rs
kubectl scale rs/web-rs --replicas=5
kubectl delete rs web-rs              # удалит и подов, которыми он владел
```

Видеть «иерархию» владения:

```bash
kubectl get pods -o wide
kubectl get pod <pod> -o jsonpath='{.metadata.ownerReferences}'
```
