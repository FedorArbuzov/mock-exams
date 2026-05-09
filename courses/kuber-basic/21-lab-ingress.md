# 21. Лаба: Ingress

Цель — поднять Ingress-контроллер и завести два приложения за одним хостом по разным путям.

## Подготовка

Включите ingress-аддон в minikube:

```bash
minikube -p mock-exams addons enable ingress
kubectl get pods -n ingress-nginx
```

Узнайте IP кластера:

```bash
minikube -p mock-exams ip
```

Добавьте в hosts-файл строку:

```
<этот IP>   app.local
```

(Windows: `C:\Windows\System32\drivers\etc\hosts`, macOS/Linux: `/etc/hosts`).

## Задание 1. Два приложения

Создайте два простых Deployment + Service:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 1
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: hashicorp/http-echo:1.0
          args: ["-text=hello from WEB"]
          ports: [{ containerPort: 5678 }]
---
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }
  ports: [{ port: 80, targetPort: 5678 }]
---
apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 1
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
        - name: api
          image: hashicorp/http-echo:1.0
          args: ["-text=hello from API"]
          ports: [{ containerPort: 5678 }]
---
apiVersion: v1
kind: Service
metadata: { name: api }
spec:
  selector: { app: api }
  ports: [{ port: 80, targetPort: 5678 }]
```

```bash
kubectl apply -f apps.yaml
kubectl get pods,svc
```

## Задание 2. Ingress с двумя путями

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.local
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api
                port: { number: 80 }
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port: { number: 80 }
```

```bash
kubectl apply -f ingress.yaml
kubectl get ingress
```

Проверка:

```bash
curl http://app.local/
curl http://app.local/api
```

**Проверка:** на `/` — `hello from WEB`, на `/api` — `hello from API`.

## Задание 3. Маршрутизация по хосту

Добавьте второй хост в hosts (`api.local`) с тем же IP. Перепишите Ingress:

```yaml
spec:
  ingressClassName: nginx
  rules:
    - host: web.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: web, port: { number: 80 } } }
    - host: api.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend: { service: { name: api, port: { number: 80 } } }
```

Не забудьте `web.local` и `api.local` в `hosts`. Затем:

```bash
curl http://web.local
curl http://api.local
```

## Задание 4. Сломанный Ingress

1. Поменяйте `service.name: api` на несуществующий `apii`.
2. Примените, посмотрите:
   ```bash
   kubectl describe ingress app
   kubectl logs -n ingress-nginx deploy/ingress-nginx-controller --tail=50
   ```

**Что должно быть:** в логах контроллера предупреждение про неизвестный сервис; `/api` начинает отдавать 503/404 (зависит от контроллера). Верните как было.

## Уборка

```bash
kubectl delete -f ingress.yaml
kubectl delete -f apps.yaml
```

(Уберите записи из `hosts`, если не нужны.)

## Вопросы для самопроверки

1. Чем Ingress отличается от Service типа `LoadBalancer`?
2. Зачем нужен Ingress Controller отдельно от объекта Ingress?
3. Что происходит, если Ingress ссылается на несуществующий сервис?
