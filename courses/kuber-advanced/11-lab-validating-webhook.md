# 11. Лаба: запретить образы с тегом `latest`

Используем **Kyverno** — policy engine без написания webhook-кода.

## Задание 1. Установить Kyverno

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update
helm install kyverno kyverno/kyverno -n kyverno --create-namespace --wait
kubectl get pods -n kyverno
```

## Задание 2. ClusterPolicy — запрет latest

`deny-latest.yaml`:

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: disallow-latest-tag
spec:
  validationFailureAction: Enforce
  background: true
  rules:
    - name: require-image-tag-not-latest
      match:
        any:
          - resources:
              kinds: [Pod]
      validate:
        message: "Using ':latest' tag is not allowed."
        pattern:
          spec:
            containers:
              - image: "!*:latest"
```

```bash
kubectl apply -f deny-latest.yaml
```

## Задание 3. Проверить

```bash
kubectl create namespace lab-webhook
kubectl run bad --image=nginx:latest -n lab-webhook
# blocked

kubectl run good --image=nginx:1.27-alpine -n lab-webhook
# OK (если PSA не мешает — используйте default ns или ns без restricted)
```

Если PSA `restricted` на `default` — тестируйте в namespace без PSA:

```bash
kubectl create namespace lab-webhook
kubectl label namespace lab-webhook pod-security.kubernetes.io/enforce=privileged
kubectl run bad --image=nginx:latest -n lab-webhook
```

## Задание 4. Policy report

```bash
kubectl get clusterpolicy
kubectl describe clusterpolicy disallow-latest-tag
```

## Задание 5. (Опционально) require digest

```yaml
validate:
  message: "Image must use digest pin"
  pattern:
    spec:
      containers:
        - image: "*@sha256:*"
```

## Уборка

```bash
kubectl delete clusterpolicy disallow-latest-tag
helm uninstall kyverno -n kyverno
kubectl delete namespace kyverno lab-webhook --ignore-not-found
```

## Вопросы для самопроверки

1. Чем Kyverno проще самописного webhook?
2. Что делает `validationFailureAction: Enforce`?
3. Где в цепочке admission срабатывает Kyverno?
