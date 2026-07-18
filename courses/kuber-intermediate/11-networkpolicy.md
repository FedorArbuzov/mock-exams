# 11. NetworkPolicy

## По умолчанию всё открыто

В Kubernetes **по умолчанию** любой под может обратиться к любому другому поду в любом namespace. Это удобно для разработки, но плохо для production:

- скомпрометированный фронтенд может пойти в Postgres напрямую;
- сервис «отчётов» может стучаться в кэш платежей, хотя ему не положено;
- любой под может стучаться в kube-system.

**NetworkPolicy** — объект, который вводит «межсетевые правила» внутри кластера. Это L3/L4 (IP, порт), не L7. Для HTTP-уровня нужен service mesh.

## Что нужно для работы

NetworkPolicy — **спецификация**. Применять её должен **CNI-плагин**. В minikube дефолтный CNI (`bridge`/`auto`) **не реализует** NetworkPolicy — правила создаются, но не работают.

Чтобы лаба работала, поднимите кластер с calico:

```bash
mockctl down
minikube start -p mock-exams --driver=docker --cni=calico
mockctl kubeconfig
```

(Можно сделать удобную команду `mockctl up --cni=calico` — пока этого нет в утилите.)

## Минимальный пример: «изолировать namespace»

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: secure
spec:
  podSelector: {}              # все поды в namespace
  policyTypes: [Ingress]
```

`podSelector: {}` = «применять ко всем подам в namespace `secure`». `policyTypes: [Ingress]` без `ingress` блока = «весь входящий трафик запретить».

После apply ни один под извне не может ничего открыть в `secure`. Поды внутри `secure` тоже друг до друга не достучатся (это часто забывают).

## Разрешить только определённых клиентов

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend
  namespace: secure
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Ingress]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - port: 8080
          protocol: TCP
```

Что говорит:

- Применяется только к подам с `app=backend` в namespace `secure`.
- Разрешён входящий TCP на порт 8080 **только** от подов с `app=frontend` в **этом же namespace**.
- Всё остальное — запрещено.

## Cross-namespace

Чтобы пускать трафик из другого namespace, добавьте `namespaceSelector`:

```yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: monitoring
```

`name: monitoring` — это **label на namespace** (не имя). Чтобы он был, заранее проставьте на namespace:

```bash
kubectl label namespace monitoring name=monitoring
```

Можно комбинировать с `podSelector` (логическое AND):

```yaml
ingress:
  - from:
      - namespaceSelector:
          matchLabels:
            name: monitoring
        podSelector:                # AND, не OR
          matchLabels:
            role: scraper
```

Это разрешит трафик только из подов `role=scraper` в namespace с label `name=monitoring`.

**Важно:** если `from` — это массив элементов, то между элементами **OR**, а внутри одного элемента (как выше) — **AND**.

## Egress (исходящий)

Точно так же, но `policyTypes: [Egress]`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-egress
  namespace: secure
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes: [Egress]
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: db
      ports:
        - port: 5432
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

Это разрешает backend-у ходить:

1. в Postgres (label `app=db`) на 5432;
2. в kube-dns на 53 (UDP+TCP) — иначе DNS не будет работать!

**Не забывайте про DNS** — без явного разрешения 53/UDP к kube-dns в любом restricted egress всё перестаёт резолвиться.

## По CIDR (внешний трафик)

```yaml
egress:
  - to:
      - ipBlock:
          cidr: 0.0.0.0/0
          except:
            - 169.254.169.254/32       # AWS metadata
            - 10.0.0.0/8
    ports:
      - port: 443
```

«Можно ходить в интернет на 443, но нельзя в metadata-эндпоинт и в private RFC-1918».

## Логика поведения

Чтобы понять, что произойдёт с пакетом:

1. Если **ни одна** NetworkPolicy не выбирает под → **всё разрешено** (как было до политик).
2. Если хотя бы одна выбирает → разрешено только то, что **явно перечислено** в её `ingress`/`egress`.
3. Все политики на под объединяются по **OR** (если хотя бы одна разрешает — пропускаем).

Поэтому канонический паттерн «zero trust»:

1. Сначала `default-deny` на весь namespace.
2. Потом «allow-X-from-Y» точечно для нужных пар.

## Полезные команды

```bash
kubectl get networkpolicy -n secure
kubectl describe networkpolicy default-deny -n secure

# тест — временный под и nslookup/wget/curl:
kubectl run probe --rm -it --image=busybox -- sh
# внутри:
wget -qO- http://backend.secure.svc.cluster.local:8080
nslookup backend.secure
```

## Чек-лист

- Что произойдёт после применения «default-deny» Ingress в namespace?
- Какие два фильтра `from`, `namespaceSelector`+`podSelector`, образуют AND, а какие — OR?
- Почему почти всегда нужно явно разрешать egress на kube-dns?
- В каком CNI на minikube NetworkPolicy реально работает?

В лабе [12-lab-networkpolicy.md](12-lab-networkpolicy.md) построим pattern «zero trust» внутри namespace.
