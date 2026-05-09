# 16. Service

## Зачем нужен Service

Pods — недолговечны: их IP меняются, они пересоздаются. Чтобы клиенты могли стабильно обращаться к группе подов, нужен **Service**:

- Стабильный **внутренний адрес** (`ClusterIP`) и **DNS-имя** (`<name>.<namespace>.svc.cluster.local`).
- **Балансировка** трафика между подами, попавшими под `selector`.

## Как Service выбирает поды

По **`selector`** — то есть **по labels подов**. Никакой жёсткой привязки к Deployment/ReplicaSet нет: Service смотрит только на метки.

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - name: http
      port: 80          # порт сервиса
      targetPort: 80    # порт в Pod
  type: ClusterIP
```

## Типы Service

| Тип | Что делает | Когда использовать |
|------|------------|---------------------|
| **ClusterIP** (по умолчанию) | Виртуальный IP, видный **только внутри кластера**. | Внутреннее общение между сервисами. |
| **NodePort** | Открывает один и тот же порт на **каждой ноде** (`30000–32767`). Снаружи доступно как `NodeIP:NodePort`. | Простой внешний доступ для разработки/тестов. |
| **LoadBalancer** | Запрашивает у облака внешний LB. На локальном кластере без LB-провайдера обычно «висит» в Pending. | Прод в облаке. |
| **ExternalName** | DNS-алиас на внешнее имя (CNAME). Без selector. | Когда нужно завернуть внешний хост под имя в кластере. |

## DNS внутри кластера

Если вы создали Service `web` в namespace `default`, поды могут обращаться к нему по именам:

- `web` (в том же namespace)
- `web.default` (короткая форма)
- `web.default.svc.cluster.local` (полная форма)

## Endpoints — кто реально стоит за Service

Под капотом Service собирает список IP подов в объект **Endpoints/EndpointSlice**:

```bash
kubectl get endpoints web
kubectl get endpointslices -l kubernetes.io/service-name=web
```

Если список пуст — selectors не совпадают с labels подов, или поды не `Ready`.

## Полезные команды

```bash
kubectl get svc
kubectl describe svc web
kubectl get endpoints web

# Быстрый временный pod внутри кластера, чтобы проверить доступность
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
# внутри:
# wget -qO- http://web
```

## Доступ к minikube-сервису с хоста

В minikube есть удобная команда:

```bash
minikube -p mock-exams service web
```

Она открывает туннель и (часто) сама запускает браузер. Иначе можно прокинуть порт:

```bash
kubectl port-forward svc/web 8080:80
# и открыть http://localhost:8080
```
