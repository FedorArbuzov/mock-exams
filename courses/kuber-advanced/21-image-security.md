# 21. Image security и cosign

## Supply chain

Цепочка доверия:

```text
Код → CI build → образ в registry → pull в кластер
```

Риски: подмена образа, уязвимости в base image, `:latest` без pin.

## Image pull policy

```yaml
imagePullPolicy: Always    # всегда pull (для :latest)
imagePullPolicy: IfNotPresent
imagePullPolicy: Never
```

Production: **всегда pin по digest**:

```yaml
image: nginx@sha256:abc123...
```

## Private registry

```yaml
spec:
  imagePullSecrets:
    - name: regcred
```

```bash
kubectl create secret docker-registry regcred \
  --docker-server=... --docker-username=... --docker-password=...
```

## cosign — подпись образов

[Sigstore cosign](https://docs.sigstore.dev/cosign/overview/):

```bash
# Подписать:
cosign sign myregistry.io/myapp:1.0

# Проверить:
cosign verify myregistry.io/myapp:1.0
```

В кластере — **Kyverno** или **policy-controller** требуют валидную подпись перед admit.

## Сканирование уязвимостей

- `trivy image nginx:1.27`
- В CI: block merge при CRITICAL CVE

## Чек-лист CKS

- Зачем digest вместо tag?
- Что делает cosign?
- Зачем imagePullSecrets?

Лаба: [22-lab-image-security.md](22-lab-image-security.md).
