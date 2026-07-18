# Mock CKAD — Прогон 03

**Уровень:** высокий. **Время:** 120 минут. **Темы:** Ingress, NetworkPolicy, RBAC, ServiceAccount, HPA, deployment-стратегии.

Подразумевается, что включены аддоны `metrics-server` и `ingress` — это уже делает `mockctl up`.

## Подготовка

```bash
mockctl up
bash courses/mock-ckad/03/prepare.sh
```

`prepare.sh` создаст namespace `web`, `internal`, `secure`, и заранее задеплоит вспомогательные сервисы `frontend`, `backend`, `internal-api`.

## Задачи

### Q1. Ingress по host

Создайте Ingress `app-ingress` в namespace `web`:

- хост `app.local`;
- path `/` → service `frontend:80`;
- path `/api` → service `backend:8080`;
- ingressClass — тот, что включён в minikube (по умолчанию `nginx`).

Локальная проверка: `curl --resolve app.local:80:$(minikube ip -p mock-exams) http://app.local/` возвращает страницу `frontend`.

### Q2. NetworkPolicy: «закрытый» namespace

В namespace `secure` запретите весь входящий трафик, **кроме**:

- из подов с label `role=monitoring` в любом namespace;
- из любых подов в namespace `secure`.

Egress в этом задании не ограничивайте.

### Q3. ServiceAccount + RBAC

В namespace `internal` создайте:

- ServiceAccount `reader`;
- Role `pod-reader`, разрешающий verbs `get,list,watch` на `pods` в namespace `internal`;
- RoleBinding между `reader` и `pod-reader`.

Создайте под `kubectl-pod` в namespace `internal`:

- образ `bitnami/kubectl:latest`;
- команда: `sleep 3600`;
- использует ServiceAccount `reader`.

Проверка: из этого пода `kubectl get pods -n internal` работает, а `kubectl get pods -n web` падает с Forbidden.

### Q4. HPA по CPU

Для существующего deployment `cpu-hog` в namespace `web` создайте HorizontalPodAutoscaler:

- minReplicas: 2;
- maxReplicas: 6;
- target average CPU utilization: 50%.

Проверка: `kubectl get hpa -n web` показывает `2/50%` (или близко) и не ниже 2 реплик.

### Q5. Rolling update со специфическим maxSurge / maxUnavailable

Существующий deployment `frontend` в namespace `web` обновите:

- стратегия `RollingUpdate`;
- `maxSurge: 1`;
- `maxUnavailable: 0`;
- `revisionHistoryLimit: 5`.

И обновите образ: `nginx:1.27-alpine` → `nginx:1.28-alpine`. Дождитесь завершения rollout.

### Q6. Откат deployment

После Q5 проверьте, что текущая ревизия — последняя, затем выполните откат на предыдущую (`nginx:1.27-alpine`). После отката `kubectl rollout history` должен показывать корректную текущую ревизию.

### Q7. Service по сетевому пути

В namespace `secure` создайте:

- deployment `secret-svc` (`nginx:1.27-alpine`, 2 реплики);
- Service `secret-svc` типа `ClusterIP` на порту 80.

Из пода с label `role=monitoring` (его создаст `prepare.sh` в namespace `monitoring`) `wget secret-svc.secure` должно работать. Из любого другого пода — нет.

### Q8. Liveness restart limits

Создайте в namespace `web` deployment `crashloop`:

- образ `busybox`;
- команда: `sh -c 'echo started; sleep 5; exit 1'`;
- `restartPolicy: Always` (default);
- liveness probe `tcpSocket: 80` каждые 5 секунд (это намеренно — порт не открыт, так что под будет считаться нездоровым).

Проследите за ним 30 секунд и в файл `~/q8-answer.txt` запишите **только строку** — фактический статус пода (`CrashLoopBackOff`, `Running`, `Pending` и т.д.) на момент завершения теста (значение, которое бы вернул `kubectl get pod ... -o jsonpath='{.status.containerStatuses[0].state}'`'s key).

## Проверка

```bash
bash courses/mock-ckad/03/verify.sh
```

8 вопросов, для «сдано» нужно минимум 6.

## Откат

```bash
kubectl delete ns web internal secure monitoring
```

## После попытки

Открыть [`solution.md`](solution.md).
