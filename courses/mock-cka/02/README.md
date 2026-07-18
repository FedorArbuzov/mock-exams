# Mock CKA — Прогон 02

**Уровень:** средний. **Время:** 120 минут. **Домен CKA:** scheduling, maintenance, troubleshooting.

Связь: [kuber-advanced/05–07](../kuber-advanced/05-scheduling-taints.md).

## Подготовка

```bash
mockctl up
bash courses/mock-cka/02/prepare.sh
```

На первой ноде будет taint `cka-m2=true:NoSchedule`. Deployment `needs-toleration` останется Pending без toleration. `probe-fail` — неверная liveness probe.

## Задачи

### Q1. Taint и toleration

Сделайте так, чтобы deployment `needs-toleration` в `cka-m2` стал **Running** (добавьте toleration для taint `cka-m2=true:NoSchedule`).

### Q2. nodeSelector

1. Пометьте **одну** ноду label `disktype=ssd` (можно поверх `hdd` — перезапишите).
2. Создайте Pod `ssd-pod` в `cka-m2`:
   - образ `nginx:1.27-alpine`;
   - `nodeSelector`: `disktype: ssd`.

### Q3. Pod anti-affinity

Создайте deployment `spread` в `cka-m2`:

- образ `nginx:1.27-alpine`;
- **3** реплики;
- label pod: `app=spread`;
- **required** pod anti-affinity: не размещать на одной ноде с другим pod с label `app=spread` (topologyKey `kubernetes.io/hostname`).

На одной ноде будет Running только 1 pod — это нормально для minikube; на экзамене обычно 2+ ноды.

### Q4. Cordon

1. Выполните `kubectl cordon` на **первой** ноде кластера.
2. В файл `~/cka-m2-q4.txt` запишите одно слово: `cordoned` (латиницей, без кавычек).

### Q5. Исправить probes

Почините deployment `probe-fail` в `cka-m2`: liveness probe должна проверять порт **80**, path `/`. Под должен стать Ready.

### Q6. PriorityClass

1. Создайте PriorityClass `high-work` со значением `1000000` (global default не меняйте).
2. Создайте Pod `urgent` в `cka-m2` с этим priorityClass, образ `nginx:1.27-alpine`.

### Q7. Uncordon

Снимите cordon с той же ноды (`kubectl uncordon`), чтобы кластер снова принимал новые поды.

## Проверка

```bash
bash courses/mock-cka/02/verify.sh
```

## Откат

```bash
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl taint node "$NODE" cka-m2=true:NoSchedule- 2>/dev/null || true
kubectl uncordon "$NODE" 2>/dev/null || true
kubectl delete ns cka-m2
rm -f ~/cka-m2-q4.txt
```

## После попытки

[`solution.md`](solution.md)
