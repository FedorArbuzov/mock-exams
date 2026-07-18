# 04. Audit logs

## Зачем

Audit log — кто **что** сделал в API: `user`, `verb`, `resource`, `responseStatus`. Нужен для compliance и расследований.

## Policy (что логировать)

Файл на control plane (в minikube — внутри ноды):

```yaml
apiVersion: audit.k8s.io/v1
kind: Policy
rules:
  - level: None
    users: [system:kube-proxy]
  - level: Metadata
    resources:
      - group: ""
        resources: ["events"]
  - level: RequestResponse
    resources:
      - group: ""
        resources: ["secrets", "configmaps"]
  - level: Metadata
    omitStages: [RequestReceived]
```

Уровни: `None`, `Metadata`, `Request`, `RequestResponse`.

## Backend

```yaml
# В kube-apiserver flags:
--audit-log-path=/var/log/kubernetes/audit.log
--audit-policy-file=/etc/kubernetes/audit-policy.yaml
```

## Просмотр в minikube

```bash
minikube -p mock-exams ssh
sudo cat /var/log/kubernetes/audit/audit.log | tail -5 | jq .
```

Или через `kubectl get events` для простых случаев (это не audit, но быстрый ориентир).

## Чек-лист

- Уровни audit?
- Где настраивается policy?
- Чем audit отличается от `kubectl get events`?
