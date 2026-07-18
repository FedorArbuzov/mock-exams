# 02. Лаба: unshare

## Цель лабы

Руками создать **UTS** и **PID** namespaces через `unshare` и увидеть смену hostname и дерева процессов — без Docker, на уровне ядра. После лабы фраза «контейнер = namespaces» станет конкретной.

## Предварительно

- [01. namespaces](01-namespaces.md).
- Стенд: [`deploy/linux`](../../deploy/linux/README.md).

```bash
cd deploy/linux && docker compose up -d
docker compose exec lab bash
sudo apt install -y util-linux 2>/dev/null
```

---

## Подготовка стенда

```bash
hostname
readlink /proc/self/ns/pid
readlink /proc/self/ns/uts
readlink /proc/self/ns/net
```

Запишите hostname и inode pid/uts **до** экспериментов.

---

## Задание 1. Namespace до unshare

**Зачем:** baseline для сравнения.

```bash
ps -p 1 -o pid,comm
ps aux | wc -l
```

**Что увидите:** PID 1 — systemd или init в контейнере lab; много процессов.

---

## Задание 2. UTS + hostname

**Зачем:** изолировать hostname без полного «контейнера».

```bash
sudo unshare --uts /bin/bash -c '
  hostname isolated-lab
  echo "inside: $(hostname)"
  readlink /proc/self/ns/uts
'
echo "outside: $(hostname)"
```

**Что увидите:** внутри — `isolated-lab`, снаружи — старый hostname lab.

**Если permission denied:** нужен `sudo` (CAP_SYS_ADMIN).

---

## Задание 3. PID namespace

**Зачем:** новое дерево процессов, свой PID 1.

```bash
sudo unshare --fork --pid --mount-proc /bin/bash -c '
  echo "PID1: $(ps -p 1 -o comm=)"
  ps aux | head -8
  readlink /proc/self/ns/pid
'
readlink /proc/self/ns/pid
```

**Что увидите:** внутри PID 1 — обычно `bash`; снаружи inode **pid** другой.

**Если `--mount-proc` fail:** попробуйте без него — `ps` может показывать процессы хоста (старые ядра/ограничения контейнера).

---

## Задание 4. NET namespace (опционально)

```bash
sudo unshare --net /bin/bash -c '
  ip link
  readlink /proc/self/ns/net
'
```

**Что увидите:** часто только `lo` — до настройки veth пара с хостом не создана (так делает Docker/CNI).

---

## Задание 5. Сравнение inode

Заполните таблицу:

| Где | pid ns inode | uts hostname |
|-----|--------------|--------------|
| обычный shell | | |
| unshare uts | | |
| unshare pid | | |

---

## Задание 6. Выход

`exit` из subshell. Проверьте, что hostname снаружи не изменился permanently:

```bash
hostname
```

---

## Критерии успеха

- [ ] hostname менялся внутри UTS unshare
- [ ] В PID unshare PID 1 — не systemd хоста
- [ ] inode namespaces сравнены
- [ ] Понимаете: unshare ≈ то, что делает runc

## Что унести в работу

- `kubectl exec` + `ps` — картина **внутри** pid ns pod.
- Debug на node — другие PID для тех же контейнеров.
- Для production images — **tini/dumb-init** как PID 1.

Следующий урок: [03. cgroups v2](03-cgroups.md).
