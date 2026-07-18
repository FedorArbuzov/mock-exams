# 08. Лаба: чеклист ноды

## Цель лабы

Прогнать **verify-node.sh** и вручную применить **sysctl/modules** на lab — как репетицию подготовки worker перед `kubeadm join` или mockctl.

## Предварительно

- [07. K8s node prep](07-k8s-node-prep.md).
- Стенд Up.

```bash
docker compose exec lab bash
```

---

## Подготовка стенда

```bash
hostname
swapon --show || echo "no swap"
```

---

## Задание 1. verify-node.sh

Из корня репозитория (на lab, если смонтирован repo) или скопируйте логику вручную:

```bash
# если repo доступен:
bash /path/to/courses/linux-advanced/examples/verify-node.sh

# вручную на lab:
echo "== swap =="
swapon --show || echo "swap off OK"
echo "== forward =="
sysctl net.ipv4.ip_forward
echo "== ssh =="
systemctl is-active ssh
```

**Что увидите:** `swap off OK`, `ip_forward` 0 или 1, `ssh active`.

---

## Задание 2. Модули (если возможно в контейнере)

```bash
sudo modprobe br_netfilter 2>/dev/null && echo OK || echo "modprobe may fail in container — OK for lab"
sudo modprobe overlay 2>/dev/null
lsmod | grep -E 'br_netfilter|overlay' || true
```

В Docker-контейнере модули могут быть недоступны — на **реальной VM** это обязательный шаг.

---

## Задание 3. sysctl как на K8s-ноде

```bash
cat <<'EOF' | sudo tee /etc/sysctl.d/99-kubernetes-lab.conf
net.ipv4.ip_forward = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
EOF
sudo sysctl -p /etc/sysctl.d/99-kubernetes-lab.conf 2>/dev/null || sudo sysctl --system
sysctl net.ipv4.ip_forward
```

**Если bridge-nf missing:** модуль br_netfilter не загружен — на bare metal исправьте до join.

---

## Задание 4. swapoff (учебно)

```bash
swapon --show
sudo swapoff -a 2>/dev/null || echo "no swap to disable"
swapon --show || echo "swap off OK"
```

---

## Задание 5. Сравнение с mockctl (опционально)

На хосте с кластером:

```bash
kubectl get nodes -o wide
kubectl describe node | grep -A5 Conditions
```

**Что увидите:** Ready=True при здоровой ноде.

---

## Задание 6. Чеклист в файл

```bash
tee /tmp/node-prep-checklist.txt <<'EOF'
[ ] swap off
[ ] br_netfilter loaded (on real VM)
[ ] ip_forward=1
[ ] bridge-nf-call-iptables=1
[ ] containerd/CRI running (on real node)
[ ] verify-node.sh OK
EOF
cat /tmp/node-prep-checklist.txt
```

---

## Критерии успеха

- [ ] verify-node.sh (или ручной эквивалент) без критичных сюрпризов
- [ ] `net.ipv4.ip_forward = 1` после sysctl
- [ ] Чеклист `/tmp/node-prep-checklist.txt` создан
- [ ] Понимаете, что в контейнере часть шагов — симуляция

## Что унести в работу

- Перед join — **скрипт**, не память.
- NotReady — сначала kubelet journal, swap, CNI, sysctl.
- Документируйте отличия вашего AMI от upstream kubeadm.

Следующий урок: [09. auditd](09-auditd.md).
