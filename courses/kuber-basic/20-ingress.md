# 20. Ingress

## Зачем

`Service` типа **NodePort** или **LoadBalancer** — это «один порт на одно приложение». Когда приложений много, неудобно:

- Делать LB на каждый сервис дорого.
- Хочется маршрутизировать **по hostname** и **по пути** (`/api`, `/admin`).
- Хочется один раз настроить TLS.

Эту задачу решает **Ingress** + **Ingress Controller**.

## Что есть что

- **Ingress** — это *объект* в кластере, описывающий правила маршрутизации (хосты, пути, бэкенд-сервисы).
- **Ingress Controller** — это *приложение* (под/набор подов), который читает все Ingress-объекты и применяет их у себя. Без контроллера Ingress сам по себе не работает.

Популярные контроллеры: **ingress-nginx**, Traefik, HAProxy, облачные (NGINX/ALB у AWS, GCE Ingress).

## Как трафик идёт

```
[браузер] -> NodePort/LoadBalancer контроллера -> Ingress Controller (под) -> Service -> Pod
```

То есть в конце цепочки всё равно стоит Service. Ingress — это «маршрутизатор перед Service'ами».

## Минимальный Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: web
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  rules:
    - host: app.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port:
                  number: 80
```

Поля:

- **`ingressClassName`** — какой контроллер обрабатывает этот Ingress.
- **`rules[].host`** — по какому HTTP-заголовку `Host:` срабатывает правило (необязательно — если опустить, правило для любого хоста).
- **`paths[].path`** + **`pathType`** (`Exact` / `Prefix` / `ImplementationSpecific`).
- **`backend.service`** — какой Service и порт.

## TLS

```yaml
spec:
  tls:
    - hosts: [app.local]
      secretName: app-tls
  rules:
    - host: app.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: web
                port: { number: 80 }
```

`Secret` с типом `kubernetes.io/tls` содержит `tls.crt` и `tls.key`.

## Маршрутизация

### По хосту

```yaml
rules:
  - host: api.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend: { service: { name: api,  port: { number: 80 } } }
  - host: web.local
    http:
      paths:
        - path: /
          pathType: Prefix
          backend: { service: { name: web,  port: { number: 80 } } }
```

### По пути

```yaml
rules:
  - host: app.local
    http:
      paths:
        - path: /api
          pathType: Prefix
          backend: { service: { name: api, port: { number: 80 } } }
        - path: /
          pathType: Prefix
          backend: { service: { name: web, port: { number: 80 } } }
```

## Ingress в minikube

В minikube есть готовый аддон с **ingress-nginx**:

```bash
minikube -p mock-exams addons enable ingress
kubectl get pods -n ingress-nginx
```

После этого `ingressClassName: nginx` будет работать.

Чтобы хост `app.local` резолвился в IP minikube, добавьте строку в `hosts`-файл:

- Windows: `C:\Windows\System32\drivers\etc\hosts`
- macOS / Linux: `/etc/hosts`

```
<minikube ip>   app.local
```

IP узнать так:

```bash
minikube -p mock-exams ip
```

## Полезные команды

```bash
kubectl get ingress
kubectl describe ingress web
kubectl get ingressclass
kubectl logs -n ingress-nginx deploy/ingress-nginx-controller
```
