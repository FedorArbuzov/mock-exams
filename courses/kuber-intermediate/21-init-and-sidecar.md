# 21. Init и sidecar контейнеры

В Pod-е может быть **несколько контейнеров**. Это редко используется в туториалах, но в реальных приложениях встречается часто. Два главных паттерна:

- **Init container** — выполняется **до** основных, чтобы что-то подготовить.
- **Sidecar** — рядом с основным контейнером всё время жизни пода: логи, прокси, refresher для Secret-ов.

## Init containers

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web }
spec:
  initContainers:
    - name: setup
      image: busybox
      command: ["sh", "-c", "echo '<h1>hello</h1>' > /work/index.html"]
      volumeMounts:
        - name: html
          mountPath: /work
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      volumeMounts:
        - name: html
          mountPath: /usr/share/nginx/html
  volumes:
    - name: html
      emptyDir: {}
```

Что происходит:

1. Pod создан, kubelet видит initContainers.
2. Запускает `setup`. Ждёт его **успешного** завершения (exit 0).
3. Только потом запускает основные `containers` (`nginx`).

Init может быть несколько — выполняются **по порядку**, последовательно. Если падает — pod зависает, kubelet ретраит (по `restartPolicy` пода: `Always`/`OnFailure`/`Never`).

Типовые задачи:

- Дождаться зависимости (миграция БД готова, ConfigMap появился).
- Сгенерировать конфиг по env-переменным.
- Создать сертификаты (cert-manager делает это другим способом, но идея та же).
- Скопировать файлы из read-only image в writable volume.

Init **не запускается заново при перезапуске основного контейнера**. Он запускается заново только если пересоздаётся весь Pod.

## Sidecar (классический паттерн)

«Sidecar» в Kubernetes — это просто **второй контейнер в Pod-е**, который **долго работает** параллельно с основным. До k8s 1.29 это был договорной паттерн, без отдельного объявления.

```yaml
apiVersion: v1
kind: Pod
metadata: { name: web }
spec:
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
    - name: log-tailer
      image: busybox
      command: ["sh", "-c", "tail -F /var/log/nginx/access.log"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  volumes:
    - name: logs
      emptyDir: {}
```

Что происходит:

1. Оба контейнера стартуют одновременно.
2. Они шарят `emptyDir`, sidecar читает то, что пишет nginx.
3. `kubectl logs pod/web -c log-tailer` показывает access-логи.

Сценарии sidecar:

- **Логи** — главный пишет в файл, sidecar отгружает в Loki/CloudWatch.
- **Прокси** — TLS-терминация, авторизация (envoy/nginx).
- **Service mesh** — istio-proxy, linkerd-proxy.
- **Мониторинг** — экспортёр метрик для приложения, которое само их не отдаёт.

## Native sidecar (k8s 1.29+, beta в 1.30+)

В новых версиях у sidecar появился отдельный механизм: это **init container с `restartPolicy: Always`**:

```yaml
spec:
  initContainers:
    - name: log-tailer
      image: busybox
      restartPolicy: Always
      command: ["sh", "-c", "tail -F /var/log/nginx/access.log || sleep 60"]
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  containers:
    - name: nginx
      image: nginx:1.27-alpine
      volumeMounts:
        - name: logs
          mountPath: /var/log/nginx
  volumes:
    - name: logs
      emptyDir: {}
```

Преимущества:

- Sidecar поднимается **до** основных контейнеров. Удобно для прокси: «трафик идёт только когда proxy готов».
- Sidecar выключается **после** основных. Удобно для логов: «успей дослать оставшиеся логи перед смертью пода».
- Job-ы корректно завершаются: sidecar не «не даёт Job завершиться».

В minikube последних версий (k8s 1.29+) это работает.

## Restart-политика и kubelet

Pod-уровневая `spec.restartPolicy`:

- `Always` (default для Deployment) — kubelet пересоздаст контейнер при выходе.
- `OnFailure` (Job) — пересоздаст только при non-zero exit.
- `Never` — не пересоздаст.

Это **per-Pod**, не per-container.

## Лайфциклы init / main / sidecar — упрощённо

```text
[ Pod created ]
    │
    ▼
[ initContainers run sequentially ]   ← если есть
    │
    ▼
[ native sidecars start (k8s 1.29+) ]
    │
    ▼
[ main containers start ]
    │
    ▼
[ during life: probes, restarts ]
    │
    ▼
[ deletion: SIGTERM main → SIGTERM sidecar → SIGKILL ]
```

## Полезные команды

```bash
kubectl logs pod/web                  # логи default container-а
kubectl logs pod/web -c log-tailer    # логи конкретного контейнера
kubectl logs pod/web --all-containers # все
kubectl exec pod/web -c nginx -- sh   # exec в конкретный контейнер

# Init-контейнер увидеть:
kubectl describe pod web | grep -A4 "Init Containers"
```

## Чек-лист

- В чём разница между init и sidecar?
- Что произойдёт, если init container падает с exit 1?
- Запускается ли init заново при перезапуске основного контейнера?
- Зачем native sidecar в k8s 1.29+, если sidecar уже работал?
- Как сделать `kubectl logs` для конкретного контейнера в multi-container поде?

В лабе [22-lab-init-and-sidecar.md](22-lab-init-and-sidecar.md) соберём pod с init + sidecar и проверим лайфцикл.
