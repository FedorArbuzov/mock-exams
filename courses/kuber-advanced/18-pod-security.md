# 18. Pod Security Admission (PSA)

## Зачем

Раньше был PodSecurityPolicy (PSP) — сложный, удалён в 1.25. Замена — **Pod Security Admission** (встроен в apiserver).

PSA проверяет pod spec при create/update и **отклоняет** небезопасные поды.

## Три уровня

| Уровень | Описание |
|---|---|
| `privileged` | Без ограничений (как root, hostNetwork, …) |
| `baseline` | Минимальные ограничения (no hostPath, …) |
| `restricted` | Hardened: non-root, drop capabilities, readOnlyRootFS, … |

## Включение на namespace

Через **labels** на namespace:

```bash
kubectl label namespace my-app \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/enforce-version=latest \
  pod-security.kubernetes.io/warn=restricted \
  pod-security.kubernetes.io/audit=restricted
```

| Label suffix | Режим |
|---|---|
| `enforce` | Отклонить pod |
| `warn` | Пропустить, но предупреждение пользователю |
| `audit` | Пропустить, записать в audit log |

## Что запрещает `restricted` (основное)

- `runAsNonRoot: true` (или `runAsUser` > 0)
- `allowPrivilegeEscalation: false`
- `capabilities.drop: [ALL]`
- `seccompProfile.type: RuntimeDefault` (или Localhost)
- Запрещены: `hostNetwork`, `hostPID`, `hostIPC`, `hostPath` (кроме whitelist), `privileged: true`

## Пример compliant pod

```yaml
apiVersion: v1
kind: Pod
metadata: { name: secure }
spec:
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: nginx:1.27-alpine
      securityContext:
        allowPrivilegeEscalation: false
        capabilities:
          drop: [ALL]
        readOnlyRootFilesystem: true
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /var/cache/nginx
        - name: run
          mountPath: /var/run
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
    - name: run
      emptyDir: {}
```

nginx пишет в `/var/cache` и `/var/run` — без emptyDir с `readOnlyRootFilesystem` не взлетит.

## Проверка без apply

```bash
kubectl label namespace test psa=restricted --dry-run=client -o yaml
# или используйте политики на уровне кластера (Pod Security Standards)
```

При `kubectl apply` нарушающего pod:

```text
Error from server: pods "bad" is forbidden: violates PodSecurity "restricted:latest": ...
```

## Exemptions

В конфиге apiserver можно исключить namespaces/users. В minikube — редко нужно.

## Чек-лист CKS

- Три уровня PSA?
- Как включить `restricted` на namespace?
- Разница enforce / warn / audit?
- Что нужно для `readOnlyRootFilesystem` с nginx?
- Чем PSA заменил PSP?

Лаба: [20-lab-pod-security.md](20-lab-pod-security.md). SecurityContext детали: [19-securitycontext.md](19-securitycontext.md).
