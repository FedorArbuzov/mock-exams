# 20. Лаба: довести pod до Restricted

## Подготовка

```bash
kubectl create namespace lab-psa
kubectl label namespace lab-psa \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/audit=restricted
```

## Задание 1. Небезопасный pod — отклонён

`bad.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: bad }
spec:
  containers:
    - name: c
      image: nginx:latest
      securityContext:
        privileged: true
```

```bash
kubectl apply -f bad.yaml -n lab-psa
```

**Что увидите:** Forbidden с перечислением нарушений PSA.

## Задание 2. Исправить до Restricted

`good.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata: { name: good }
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: [ALL]
        readOnlyRootFilesystem: true
      ports: [{ containerPort: 80 }]
      volumeMounts:
        - { name: tmp, mountPath: /tmp }
        - { name: cache, mountPath: /var/cache/nginx }
        - { name: run, mountPath: /var/run }
  volumes:
    - { name: tmp, emptyDir: {} }
    - { name: cache, emptyDir: {} }
    - { name: run, emptyDir: {} }
```

```bash
kubectl apply -f good.yaml -n lab-psa
kubectl get pod good -n lab-psa
kubectl exec good -n lab-psa -- id
```

## Задание 3. Запретить `:latest` через PSA

PSA **не** проверяет тег образа. Для `latest` — admission webhook ([11-lab-validating-webhook.md](11-lab-validating-webhook.md)).

Но можно вручную:

```bash
# Попробуйте pod с image: nginx:latest без securityContext — PSA отклонит по другим причинам
```

## Задание 4. Сравнить baseline vs restricted

```bash
kubectl label namespace lab-psa \
  pod-security.kubernetes.io/enforce=baseline --overwrite
```

Примените pod без `runAsNonRoot`, но без `privileged` — пройдёт.

```bash
kubectl label namespace lab-psa \
  pod-security.kubernetes.io/enforce=restricted --overwrite
```

## Уборка

```bash
kubectl delete namespace lab-psa
```

## Вопросы для самопроверки

1. Какие 3 volume нужны nginx с readOnlyRootFilesystem?
2. Почему `privileged: true` не проходит restricted?
3. Как включить PSA на namespace?
