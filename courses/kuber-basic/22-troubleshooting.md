# 22. Troubleshooting

«Что делать, когда не работает». 90% диагностики на старте — это `describe` + `events` + `logs`. Этот раздел собирает их в систему.

## Шаг 1. Понять, на каком уровне сломалось

Цепочка от пользователя до контейнера:

```
DNS / Ingress -> Service -> Endpoints -> Pod -> Container
```

Идите **сверху вниз**: пингуется ли Service, есть ли в нём Endpoints, в каком статусе Pod, что в логах.

```bash
kubectl get ingress
kubectl get svc
kubectl get endpoints <svc>
kubectl get pods -l <label>
kubectl describe pod <name>
```

## Типичные статусы Pod и что они значат

| Статус | Смысл | Куда смотреть |
|--------|--------|----------------|
| `Pending` | Не назначен на ноду / нет места / нет PVC | `kubectl describe` → `Events` |
| `ContainerCreating` | Качаются образы / монтируются тома | `describe` → events; `kubectl get events --sort-by=.lastTimestamp` |
| `ImagePullBackOff` / `ErrImagePull` | Не качается образ | имя образа, доступность registry |
| `CrashLoopBackOff` | Контейнер падает после старта | `kubectl logs <pod> --previous` |
| `OOMKilled` (`Last State`) | Превысил memory limit | `describe`, увеличить limit или починить утечку |
| `Running 0/1` | Контейнер живой, но **readinessProbe** не проходит | проверить probe, эндпоинт, init |
| `Completed` | Контейнер штатно завершился | для Job — норма, для Deployment — поломка `command` |
| `Evicted` | Нода вытеснила pod (нехватка ресурсов) | смотреть `describe`, причина в `Status` |
| `Terminating` (висит) | Не завершается finalizer / тома | `kubectl describe`, иногда `--force --grace-period=0` |

## Главные команды диагностики

```bash
# подробно про объект и его события
kubectl describe pod <name>
kubectl describe deploy <name>
kubectl describe svc <name>

# все события в namespace
kubectl get events --sort-by=.lastTimestamp
kubectl get events --field-selector type=Warning

# логи
kubectl logs <pod>
kubectl logs <pod> -c <container>
kubectl logs <pod> --previous          # после crash
kubectl logs deploy/web --tail=100 -f

# зайти внутрь
kubectl exec -it <pod> -- sh

# временный pod в кластере
kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh

# проброс порта на хост
kubectl port-forward pod/<name> 8080:80
kubectl port-forward svc/<name> 8080:80
```

## Сетевые проблемы (Service «не отвечает»)

1. **Endpoints пустые?**
   ```bash
   kubectl get endpoints <svc>
   ```
   Если 0 — selector Service не совпадает с labels подов, или поды не `Ready`.

2. **Pod вообще `Ready`?**
   ```bash
   kubectl get pods -l <selector>
   ```
   `0/1 Ready` — значит readinessProbe не проходит.

3. **Из соседнего pod достучаться можно?**
   ```bash
   kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- \
     wget -qO- http://<svc>:<port>
   ```

4. **Имя резолвится?**
   ```bash
   kubectl run tmp --rm -it --image=busybox:1.36 --restart=Never -- \
     nslookup <svc>
   ```

## Образы не качаются

```bash
kubectl describe pod <name>
```

В `Events`:

- `Failed to pull image "..."` — опечатка в имени, тег не существует, нет интернета.
- `ImagePullBackOff` — повторные попытки. После исправления `apply` обычно достаточно.
- `Authentication required` — нужен **imagePullSecret** для приватного registry.

## Ресурсы

```bash
kubectl top pod
kubectl top node
kubectl describe node <name> | grep -A5 'Allocated resources'
```

`Pending` + событие `0/1 nodes are available: insufficient cpu/memory` — на нодах нет места под `requests`.

## kubectl debug (ephemeral containers)

Когда в исходном образе нет `sh`, `curl`, `nc`:

```bash
kubectl debug -it <pod> --image=busybox:1.36 --target=<container-name>
```

Подключается рядом «дебаг-контейнер» в тот же pod, видит процессы.

Для node:

```bash
kubectl debug node/<node> -it --image=busybox:1.36
```

## API-уровень

Если ничего не работает в принципе:

```bash
kubectl cluster-info
kubectl get componentstatuses           # устаревшее, но индикативно
kubectl get nodes
kubectl get pods -n kube-system         # системные компоненты
```

Если `kubectl` сам не отвечает — проверьте `kubeconfig` (`kubectl config view`), доступность API-сервера (адрес из kubeconfig + порт `6443` обычно).

## Чек-лист «не работает»

1. `kubectl get pods` — все ли в `Running` и `READY`?
2. `kubectl describe pod` — что в `Events`?
3. `kubectl logs <pod> [--previous]` — что говорит приложение?
4. `kubectl get svc` + `kubectl get endpoints` — Service знает про поды?
5. Из временного pod `wget`/`curl` к Service — отвечает?
6. DNS работает (`nslookup <svc>`)?
7. Если Ingress — `kubectl describe ingress`, логи `ingress-nginx-controller`.
8. Resources / квоты — `kubectl top`, `describe node`.
