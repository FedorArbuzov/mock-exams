# 12. Лаба: «закрыть» namespace, кроме одного клиента

## Подготовка

Эта лаба требует **calico** в minikube. Если ещё нет:

```bash
mockctl down
minikube start -p mock-exams --driver=docker --cni=calico
mockctl kubeconfig
```

Дальше:

```bash
kubectl create namespace secure
kubectl create namespace clients
kubectl label namespace clients name=clients
```

## Задание 1. Развернуть «жертву» и «двух клиентов»

`backend.yaml` (в namespace `secure`):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: secure
spec:
  selector:
    app: backend
  ports:
    - port: 80
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: secure
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: nginx
          image: nginx:1.27-alpine
```

`clients.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: ally
  namespace: clients
  labels:
    role: ally
spec:
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
---
apiVersion: v1
kind: Pod
metadata:
  name: stranger
  namespace: clients
  labels:
    role: stranger
spec:
  containers:
    - name: c
      image: busybox
      command: ["sleep", "3600"]
```

```bash
kubectl apply -f backend.yaml -f clients.yaml
kubectl wait --for=condition=ready pod -l app=backend -n secure
kubectl wait --for=condition=ready pod/ally pod/stranger -n clients
```

## Задание 2. Проверить, что сейчас всё открыто

```bash
kubectl exec -n clients ally     -- wget -qO- --timeout=3 http://backend.secure
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure
```

**Что увидите:** оба клиента получают страницу nginx. По умолчанию — никаких ограничений.

## Задание 3. Default-deny

`netpol-deny.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: secure
spec:
  podSelector: {}
  policyTypes: [Ingress]
```

```bash
kubectl apply -f netpol-deny.yaml
kubectl exec -n clients ally     -- wget -qO- --timeout=3 http://backend.secure || echo blocked
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure || echo blocked
```

**Что увидите:** оба запроса виснут до таймаута (`blocked`). Вход в `secure` закрыт для всех.

## Задание 4. Разрешить только `ally`

`netpol-allow-ally.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ally
  namespace: secure
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Ingress]
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: clients
          podSelector:
            matchLabels:
              role: ally
      ports:
        - port: 80
          protocol: TCP
```

Обратите внимание: `namespaceSelector` и `podSelector` указаны **как один элемент** в `from` — это означает AND.

```bash
kubectl apply -f netpol-allow-ally.yaml
kubectl exec -n clients ally     -- wget -qO- --timeout=3 http://backend.secure
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure || echo blocked
```

**Что увидите:** `ally` получает страницу, `stranger` блокирован.

## Задание 5. Эксперимент с OR

Замените `from` так, чтобы было два **разных** элемента:

```yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: clients
      - podSelector:
          matchLabels:
            role: ally
    ports:
      - port: 80
```

Это OR: «или из namespace clients, **или** под с label `role=ally` (внутри `secure`!)».

Применить и проверить:

```bash
kubectl exec -n clients stranger -- wget -qO- --timeout=3 http://backend.secure
```

**Что должно произойти:** `stranger` теперь тоже видит backend. Потому что `namespaceSelector: name=clients` разрешает **любой** под из этого namespace. Это иллюстрирует, как меняется логика при «двух элементах» в массиве `from`.

Верните на правильный конфиг (один элемент с двумя селекторами) перед следующими шагами.

## Задание 6. Egress + DNS

Добавим клиенту egress-политику. В namespace `clients`:

`netpol-clients-egress.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ally-egress-only-backend
  namespace: clients
spec:
  podSelector:
    matchLabels:
      role: ally
  policyTypes: [Egress]
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              name: secure
          podSelector:
            matchLabels:
              app: backend
      ports:
        - port: 80
```

```bash
kubectl label namespace secure name=secure
kubectl apply -f netpol-clients-egress.yaml
kubectl exec -n clients ally -- wget -qO- --timeout=3 http://backend.secure
```

**Что увидите:** запрос виснет. Почему?

DNS-трафик (53/UDP к kube-dns) тоже заблокирован, и `ally` не может резолвнуть `backend.secure` в IP. Допишите правило для DNS:

```yaml
egress:
  - to:
      - namespaceSelector:
          matchLabels:
            name: secure
        podSelector:
          matchLabels:
            app: backend
    ports:
      - port: 80
  - to:
      - namespaceSelector: {}
        podSelector:
          matchLabels:
            k8s-app: kube-dns
    ports:
      - port: 53
        protocol: UDP
      - port: 53
        protocol: TCP
```

```bash
kubectl apply -f netpol-clients-egress.yaml
kubectl exec -n clients ally -- wget -qO- --timeout=3 http://backend.secure
```

**Что должно произойти:** теперь работает. Вы только что повторили классический рейк «restrict egress сломал DNS — почините».

## Уборка

```bash
kubectl delete namespace secure clients
```

## Вопросы для самопроверки

1. Что делает `podSelector: {}` без `policyTypes`?
2. Почему «default-deny» влияет и на трафик внутри namespace тоже?
3. AND или OR — `from` с одним элементом, в котором сразу `namespaceSelector` и `podSelector`?
4. Какой namespace label k8s ставит автоматически (без вашего `kubectl label`)?
5. Зачем при ограничивающем egress всегда явно разрешать кубовый kube-dns?
