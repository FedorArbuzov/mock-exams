# 19. Лаба: Namespace

Цель — научиться раскладывать объекты по NS, обращаться между ними и переключать «текущий» NS.

## Задание 1. Создать два namespace

```bash
kubectl create namespace team-a
kubectl create namespace team-b
kubectl get ns
```

**Проверка:** оба NS видны в списке.

## Задание 2. Один и тот же манифест в двух NS

Используйте Deployment из лабы 11 (`web`, `nginx:1.27`, 2 реплики).

```bash
kubectl apply -f deploy.yaml -n team-a
kubectl apply -f deploy.yaml -n team-b

kubectl get deploy -A | grep web
kubectl get pods -n team-a
kubectl get pods -n team-b
```

**Проверка:** в обоих NS есть Deployment `web` и его поды.

## Задание 3. Service в каждом NS

В обоих NS создайте Service `web` (как в лабе 17):

```bash
kubectl apply -f svc.yaml -n team-a
kubectl apply -f svc.yaml -n team-b
```

Поменяйте контент страниц, чтобы видеть разницу:

```bash
for p in $(kubectl get pods -n team-a -l app=web -o name); do
  kubectl -n team-a exec $p -- sh -c "echo TEAM-A-$p > /usr/share/nginx/html/index.html"
done
for p in $(kubectl get pods -n team-b -l app=web -o name); do
  kubectl -n team-b exec $p -- sh -c "echo TEAM-B-$p > /usr/share/nginx/html/index.html"
done
```

## Задание 4. Обращение между NS

Запустите временный pod в `team-a`:

```bash
kubectl -n team-a run tmp --rm -it --image=busybox:1.36 --restart=Never -- sh
```

Внутри проверьте:

```sh
wget -qO- http://web                 # тот же NS  -> TEAM-A-...
wget -qO- http://web.team-b          # другой NS -> TEAM-B-...
wget -qO- http://web.team-b.svc.cluster.local
```

**Проверка:** короткое имя `web` ходит в свой NS, через `.team-b` — в чужой.

## Задание 5. Текущий namespace

```bash
kubectl config set-context --current --namespace=team-a
kubectl get pods                # без -n покажет поды team-a
kubectl get pods -n team-b      # явный NS
```

Верните обратно в `default`:

```bash
kubectl config set-context --current --namespace=default
```

## Задание 6. Удаление NS

```bash
kubectl delete ns team-a team-b
kubectl get ns
```

**Проверка:** NS исчезли вместе со всеми Deployment/Service/Pod внутри них.

## Вопросы для самопроверки

1. Какие объекты **не** скоупятся по namespace?
2. Чем отличаются `web`, `web.team-b` и `web.team-b.svc.cluster.local`?
3. Почему `kubectl delete ns ...` — потенциально опасная команда в проде?
