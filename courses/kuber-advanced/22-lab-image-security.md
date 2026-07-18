# 22. Лаба: cosign и digest pin

## Задание 1. Pin по digest

```bash
docker pull nginx:1.27-alpine
DIGEST=$(docker inspect nginx:1.27-alpine --format='{{index .RepoDigests 0}}')
echo $DIGEST
```

```yaml
containers:
  - name: c
    image: nginx@sha256:....   # подставьте digest
```

```bash
kubectl apply -f pod.yaml
```

## Задание 2. trivy scan (если установлен)

```bash
trivy image nginx:1.27-alpine --severity HIGH,CRITICAL
```

## Задание 3. cosign (опционально)

```bash
# Установить cosign: https://docs.sigstore.dev/cosign/installation/
cosign generate-key-pair
docker pull nginx:1.27-alpine
cosign sign --key cosign.key nginx:1.27-alpine
cosign verify --key cosign.pub nginx:1.27-alpine
```

## Задание 4. Kyverno verifyImages (опционально)

С Kyverno из [11-lab-validating-webhook.md](11-lab-validating-webhook.md) можно добавить policy `verifyImages` — см. документацию Kyverno.

## Вопросы

1. Почему digest надёжнее tag?
2. Что проверяет cosign verify?
