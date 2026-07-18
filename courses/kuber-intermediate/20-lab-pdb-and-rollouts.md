# 20. Лаба: PDB, rolling update, drain

В minikube одна нода, поэтому полностью «эвакуировать» сервис не получится — но всё поведение PDB и rolling update мы увидим.

## Подготовка

```bash
kubectl create namespace lab-pdb
kubectl config set-context --current --namespace=lab-pdb
```

## Задание 1. Deployment с RollingUpdate

`web.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels: { app: web }
  template:
    metadata:
      labels: { app: web }
    spec:
      terminationGracePeriodSeconds: 15
      containers:
        - name: nginx
          image: nginx:1.27-alpine
          lifecycle:
            preStop:
              exec:
                command: ["sh", "-c", "sleep 5"]
```

```bash
kubectl apply -f web.yaml
kubectl rollout status deploy/web
kubectl get pods -l app=web
```

## Задание 2. Создать PDB

`pdb.yaml`:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata: { name: web-pdb }
spec:
  selector:
    matchLabels: { app: web }
  minAvailable: 3
```

```bash
kubectl apply -f pdb.yaml
kubectl get pdb web-pdb
```

**Что увидите:** в выводе `ALLOWED DISRUPTIONS: 1`. У вас 4 пода, нужно минимум 3 → можно одновременно эвакуировать одного.

## Задание 3. Rollout нового образа

```bash
kubectl set image deploy/web nginx=nginx:1.28-alpine
kubectl rollout status deploy/web
```

Параллельно во второй вкладке:

```bash
kubectl get pods -l app=web -w
```

**Что увидите:** одновременно жив **3..5** подов (max 1 unavailable + max 1 surge). Старые гасятся, новые поднимаются. Каждое снятие — `Terminating` 5 секунд (из-за preStop), потом исчезновение.

## Задание 4. Eviction через API

Чтобы увидеть, что PDB реально блокирует — попробуйте удалить через eviction API:

```bash
POD=$(kubectl get pod -l app=web -o jsonpath='{.items[0].metadata.name}')
kubectl get pdb web-pdb -o jsonpath='{.status.disruptionsAllowed}{"\n"}'
# = 1

# Сейчас одно eviction разрешено:
kubectl exec -n kube-system -it $(kubectl get pod -n kube-system -l k8s-app=kube-apiserver -o name 2>/dev/null | head -1) 2>/dev/null || true
```

Удалить через eviction (есть готовый skript `kubectl delete --grace-period=0` НЕ через eviction; eviction делается через API, проще через `kubectl drain`):

```bash
# Drain текущей ноды (она одна на minikube):
NODE=$(kubectl get nodes -o name | head -1 | sed 's@node/@@')
kubectl drain "$NODE" --ignore-daemonsets --delete-emptydir-data --force --pod-selector=app=web
```

**Что увидите:** drain снимет одного пода, потом «зависнет» — потому что у нас 4 реплики, после снятия 1 осталось 3, но новый под не может подняться (нода cordon-нута). PDB не позволяет evict-нуть второго.

В отдельной вкладке проверьте:

```bash
kubectl get pdb web-pdb
kubectl get pods -l app=web -o wide
```

## Задание 5. Снять cordon

```bash
kubectl uncordon "$NODE"
kubectl get pods -l app=web -w
```

**Что увидите:** новый под поднимается (нода снова schedulable), число `Available` в PDB растёт обратно до 4.

Если drain ещё «висит» во второй вкладке — он завершится автоматически.

## Задание 6. PDB слишком жёсткий

Поменяйте PDB на `minAvailable: 4` и попробуйте rollout:

```bash
kubectl patch pdb web-pdb -p '{"spec":{"minAvailable":4}}'
kubectl get pdb
# ALLOWED DISRUPTIONS: 0

kubectl set image deploy/web nginx=nginx:1.27.1-alpine
kubectl rollout status deploy/web --timeout=60s
```

**Что увидите:** rollout «висит». Deployment **не может** снять старые поды, потому что PDB запрещает opustit'sya niже 4. С `maxSurge: 1` он может **сначала** создать 5-го пода, и только потом снять одного — что и происходит, медленнее. Если бы было `maxSurge: 0` — rollout встал бы намертво.

Откатите PDB:

```bash
kubectl patch pdb web-pdb -p '{"spec":{"minAvailable":3}}'
kubectl rollout status deploy/web
```

## Уборка

```bash
kubectl delete namespace lab-pdb
kubectl config set-context --current --namespace=default
```

## Вопросы для самопроверки

1. От каких видов disruption PDB не защищает?
2. Что произойдёт с `kubectl drain`, если PDB запрещает eviction всех подов?
3. Зачем нужен `preStop` со `sleep 5`?
4. Что вернёт `kubectl get pdb -o jsonpath='{.status.disruptionsAllowed}'`, если у вас 4 пода и `minAvailable: 4`?
5. Может ли PDB заблокировать сам Deployment rollout? При каких условиях?
