# 7. Лаба: Поды

Цель — научиться создавать, наблюдать и удалять Pod, читать его состояние.

> Перед стартом: кластер запущен (`scripts\minikube-up.cmd` или `./scripts/minikube-up.sh`), `kubectl get nodes` показывает `Ready`.

## Задание 1. Запустить «голый» Pod

1. Создайте Pod с образом `nginx:1.27` командой `kubectl run`.
2. Посмотрите его статус и IP внутри кластера (`-o wide`).
3. Зайдите в контейнер и убедитесь, что nginx отдаёт страницу:
   ```bash
   kubectl exec -it <pod> -- curl -s localhost:80 | head -n 5
   ```

**Проверка:** `kubectl get pods` — статус `Running`, `READY 1/1`.

## Задание 2. Посмотреть события и логи

1. Получите подробное описание Pod (`describe`).
2. Найдите в выводе раздел **Events** — что писалось при старте.
3. Посмотрите логи контейнера (`logs`).

**Проверка:** в логах nginx есть строки про access/error.

## Задание 3. Создать Pod из YAML

Напишите файл `pod.yaml`:

- `kind: Pod`, имя `web`, label `app=web`.
- Один контейнер `nginx:1.27`, порт 80.
- Переменная окружения `GREETING=hello`.
- `requests`: CPU `50m`, memory `64Mi`.

Примените и проверьте:

```bash
kubectl apply -f pod.yaml
kubectl get pods --show-labels
kubectl exec web -- printenv GREETING
```

**Проверка:** Pod в `Running`, метка видна, переменная равна `hello`.

## Задание 4. Сломать и починить

1. В `pod.yaml` поставьте заведомо несуществующий образ, например `nginx:does-not-exist`.
2. Примените (`apply`) — для нового Pod дайте ему другое имя, например `web-bad`.
3. Найдите причину проблемы в `kubectl describe pod web-bad`.
4. Исправьте образ обратно и снова `apply`.

**Проверка:** в `describe` есть `ImagePullBackOff` / `ErrImagePull` до правки и `Running` после.

## Задание 5. Pod с двумя контейнерами

Сделайте Pod с двумя контейнерами:

- `web` — `nginx:1.27`.
- `pinger` — `busybox:1.36`, команда `["sh","-c","while true; do wget -qO- localhost:80 >/dev/null && echo ok; sleep 5; done"]`.

Проверьте, что `pinger` видит `web` по `localhost`:

```bash
kubectl logs <pod> -c pinger
```

**Проверка:** в логах `pinger` идут строки `ok`.

## Уборка

```bash
kubectl delete pod web web-bad <multi-pod>
# или
kubectl delete -f pod.yaml
```

## Вопросы для самопроверки

1. Что произойдёт с Pod, если убить ноду, на которой он живёт? (Подсказка: ничего хорошего, см. следующий раздел про ReplicaSet.)
2. Почему в одной паре контейнеров доступен `localhost`, а между двумя разными Pod — нет?
3. Чем `kubectl logs` отличается от `kubectl exec ... cat /var/log/...`?
