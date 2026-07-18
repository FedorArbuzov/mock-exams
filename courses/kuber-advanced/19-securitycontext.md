# 19. SecurityContext

## Уровни

| Уровень | Поле | Влияет на |
|---|---|---|
| Pod | `spec.securityContext` | Все контейнеры в pod |
| Container | `containers[].securityContext` | Один контейнер (переопределяет pod) |

## Ключевые поля

### runAsUser / runAsNonRoot

```yaml
securityContext:
  runAsUser: 1000
  runAsNonRoot: true
```

Процесс **не root** (UID 0). `runAsNonRoot: true` — kubelet отклонит образ, если USER в Dockerfile = 0.

### runAsGroup / fsGroup

```yaml
securityContext:
  runAsGroup: 3000
  fsGroup: 2000
```

`fsGroup` — группа для volumes; файлы на volume получат GID 2000.

### capabilities

```yaml
securityContext:
  capabilities:
    drop: [ALL]
    add: [NET_BIND_SERVICE]    # только если нужен порт < 1024
```

`drop: [ALL]` — best practice. Добавляйте минимум.

### privileged

```yaml
securityContext:
  privileged: true    # почти root на хосте — избегайте
```

### allowPrivilegeEscalation

```yaml
securityContext:
  allowPrivilegeEscalation: false
```

Запрещает setuid-биты давать больше прав (например `no_new_privs`).

### readOnlyRootFilesystem

```yaml
securityContext:
  readOnlyRootFilesystem: true
volumeMounts:
  - name: tmp
    mountPath: /tmp
volumes:
  - name: tmp
    emptyDir: {}
```

Всё, куда приложение пишет, — через отдельные volumes.

### seccompProfile

```yaml
securityContext:
  seccompProfile:
    type: RuntimeDefault
```

Ограничивает syscalls. `RuntimeDefault` — профиль container runtime.

## Пример: hardened Deployment

```yaml
spec:
  template:
    spec:
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: myapp:1.0
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            capabilities:
              drop: [ALL]
```

## Проверка в runtime

```bash
kubectl exec pod/name -- id
# uid=1000 gid=0 ...
```

## Чек-лист

- Pod vs container securityContext — кто кого переопределяет?
- Зачем `drop: [ALL]`?
- Почему nginx с `readOnlyRootFilesystem` нужны emptyDir?
- Что делает `allowPrivilegeEscalation: false`?

Лаба: [20-lab-pod-security.md](20-lab-pod-security.md).
