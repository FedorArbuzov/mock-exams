# 10. Admission webhooks

## Где в цепочке admission

После authn/authz, **до** записи в etcd:

```text
kubectl apply
    → MutatingAdmissionWebhook   (может изменить объект)
    → ValidatingAdmissionWebhook (может отклонить)
    → etcd
```

## Validating vs Mutating

| | Validating | Mutating |
|---|---|---|
| Может изменить объект? | Нет | Да |
| Может отклонить? | Да | Да |
| Пример | «запретить :latest» | «добавить sidecar», «проставить labels» |

## Регистрация webhook

```yaml
apiVersion: admissionregistration.k8s.io/v1
kind: ValidatingWebhookConfiguration
metadata:
  name: deny-latest
webhooks:
  - name: deny-latest.example.com
    rules:
      - apiGroups: [""]
        apiVersions: [v1]
        operations: [CREATE, UPDATE]
        resources: [pods]
        scope: Namespaced
    clientConfig:
      service:
        namespace: webhook-system
        name: webhook-svc
        path: /validate
      caBundle: <base64-ca>    # CA для TLS сервера webhook
    admissionReviewVersions: [v1]
    sideEffects: None
    timeoutSeconds: 5
    failurePolicy: Fail          # Fail = отклонить при недоступности webhook
```

`failurePolicy: Ignore` — пропустить, если webhook недоступен (опасно для security).

## TLS

Apiserver вызывает webhook по HTTPS. Нужны:

1. Сертификат для Service webhook-а (часто cert-manager).
2. `caBundle` в ValidatingWebhookConfiguration — CA, которой apiserver доверяет.

На minikube cert-manager или self-signed + ручной caBundle.

## Что получает webhook

POST с `AdmissionReview`:

```json
{
  "request": {
    "uid": "...",
    "object": { ... Pod JSON ... },
    "operation": "CREATE"
  }
}
```

Ответ:

```json
{
  "response": {
    "uid": "...",
    "allowed": false,
    "status": { "message": "image tag :latest is not allowed" }
  }
}
```

## Готовые решения

- **Kyverno** — policies как YAML, без кода.
- **OPA Gatekeeper** — Rego policies.
- Свой webhook на Go/Python — полный контроль.

## Чек-лист CKS

- Порядок mutating vs validating?
- Что такое `failurePolicy: Fail`?
- Зачем `caBundle`?
- Может ли validating webhook изменить pod?
- Пример политики для production?

Лаба: [11-lab-validating-webhook.md](11-lab-validating-webhook.md) — Kyverno (проще, чем писать webhook с нуля).
