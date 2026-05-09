# 17. Лаба: Service

Цель — научиться выставлять группу подов под одним стабильным именем и проверять, что трафик балансируется.

## Подготовка

Поднимите Deployment из лабы 11 (если ещё нет):

```bash
kubectl apply -f deploy.yaml      # web, 3 реплики, label app=web
kubectl get pods -l app=web
```

## Задание 1. ClusterIP-сервис

Файл `svc.yaml`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web
spec:
  selector:
    app: web
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

```bash
kubectl apply -f svc.yaml
kubectl get svc web
kubectl get endpoints web
```

**Проверка:** в `endpoints` три IP — это IP подов из Deployment.

## Задание 2. Доступ изнутри кластера

Запустите временный Pod и обратитесь к Service по имени:

```bash
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
# внутри:
wget -qO- http://web | head -n 5
```

**Проверка:** возвращается дефолтная страница nginx.

## Задание 3. Балансировка

Чтобы увидеть балансировку, заставим поды отдавать своё имя:

1. Подменим страницу в каждом поде уникальным значением:
   ```bash
   for p in $(kubectl get pods -l app=web -o name); do
     kubectl exec $p -- sh -c "echo $p > /usr/share/nginx/html/index.html"
   done
   ```
   *(в PowerShell — выполните цикл вручную или адаптируйте; смысл: в каждом Pod записать своё имя в `index.html`)*

2. Из временного Pod несколько раз сходите на сервис:
   ```bash
   kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
   for i in $(seq 1 10); do wget -qO- http://web; done
   ```

**Проверка:** в выводе встречаются разные имена подов.

## Задание 4. NodePort

1. Поменяйте в `svc.yaml`:
   ```yaml
   spec:
     type: NodePort
     ports:
       - port: 80
         targetPort: 80
         nodePort: 30080
   ```
2. `kubectl apply -f svc.yaml`.
3. Откройте сервис через minikube:
   ```bash
   minikube -p mock-exams service web --url
   ```
4. Откройте полученный URL в браузере.

**Проверка:** в браузере видна страница из nginx.

## Задание 5. Selector «не туда»

1. Поменяйте `selector` в Service на `app: nope`.
2. Примените и посмотрите endpoints:
   ```bash
   kubectl get endpoints web
   ```

**Что должно быть:** в endpoints **ноль** адресов, запросы к Service не доходят. Это типичная ошибка — несовпадение selectors и labels.

3. Верните `selector: app: web`.

## Задание 6. port-forward

```bash
kubectl port-forward svc/web 8080:80
```

В браузере хоста: `http://localhost:8080`.

**Проверка:** страница открывается. `port-forward` работает только пока запущена команда.

## Уборка

```bash
kubectl delete -f svc.yaml
```

## Вопросы для самопроверки

1. Что общего и в чём разница между `ClusterIP`, `NodePort` и `LoadBalancer`?
2. Зачем существует `EndpointSlice`, если есть `Endpoints`?
3. Почему сервис `web` доступен по имени `web` из любого Pod в том же namespace?
