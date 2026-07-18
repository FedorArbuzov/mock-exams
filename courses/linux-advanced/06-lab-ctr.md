# 06. Лаба: ctr и runtime на ноде

## Цель лабы

Увидеть цепочку **образ → containerd/crictl → runtime version** на учебной машине или K8s-ноде. В lab-образе `ctr` может отсутствовать — тогда эквивалент через **docker на хосте** и **kubectl** на кластере.

## Предварительно

- [05. containerd](05-containerd.md).
- Стенд lab; опционально хост с Docker / mockctl.

---

## Подготовка стенда

```bash
docker compose exec lab bash
which ctr crictl docker 2>/dev/null
```

---

## Задание 1. Проверка инструментов в lab

```bash
ctr version 2>/dev/null || echo "ctr not in lab image"
crictl version 2>/dev/null || echo "crictl not in lab image"
```

**Зачем:** lab — не полноценная K8s-нода; инструменты могут быть только на хосте.

---

## Задание 2. Docker на хосте (эквивалент pull/run)

На **хосте** (Windows/WSL или Linux), каталог `deploy/linux`:

```bash
docker version --format '{{.Server.Version}}'
docker images | head -6
docker run --rm hello-world
```

**Что увидите:** pull/run проходит ту же модель OCI-образа (через dockerd → containerd на современном Docker).

---

## Задание 3. ctr pull (если ctr есть)

На машине с containerd:

```bash
sudo ctr images pull docker.io/library/alpine:latest
sudo ctr images ls | grep alpine
```

В lab, если `ctr` установите:

```bash
sudo apt install -y containerd 2>/dev/null
sudo ctr images pull docker.io/library/alpine:latest
```

---

## Задание 4. Runtime version на Kubernetes

На хосте с **mockctl** / minikube / kind:

```bash
kubectl get nodes -o wide
kubectl get nodes -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.status.nodeInfo.containerRuntimeVersion}{"\n"}{end}'
```

**Что увидите:** `containerd://...` или `docker://...`.

---

## Задание 5. crictl на ноде (опционально)

SSH на worker (если есть):

```bash
sudo crictl ps
sudo crictl images | head -10
```

Сопоставьте с `kubectl get pods -o wide` — те же контейнеры, другой интерфейс.

---

## Задание 6. Краткие заметки

В `/tmp/runtime-notes.txt` на lab (один абзац):

- чем отличается `docker ps` от `crictl ps`;
- кто вызывает runc в K8s.

---

## Критерии успеха

- [ ] Понимаете цепочку kubelet → CRI → containerd → runc
- [ ] Видели `docker images` или `ctr images ls`
- [ ] Видели containerRuntimeVersion на ноде **или** зафиксировали «кластера нет — см. теорию»

## Что унести в работу

- На worker: **`crictl`**, не docker.
- ImagePullBackOff — `crictl pull` / registry auth на **ноде**.
- Место на диске: `/var/lib/containerd`.

Следующий урок: [07. Подготовка ноды K8s](07-k8s-node-prep.md).
