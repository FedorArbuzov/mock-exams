# 04. Лаба: MemoryMax в systemd

## Цель лабы

Создать unit с **намеренной утечкой памяти**, ограничить **MemoryMax=64M** и увидеть **OOM/kill** в journal — тот же механизм, что OOMKilled pod в Kubernetes.

## Предварительно

- [03. cgroups v2](03-cgroups.md).
- lab, sudo.

```bash
docker compose exec lab bash
```

---

## Подготовка стенда

```bash
cat /sys/fs/cgroup/cgroup.controllers 2>/dev/null | head -1
free -h
```

---

## Задание 1. Unit с лимитом

**Зачем:** cgroup через systemd без ручного echo в sysfs.

```bash
sudo tee /etc/systemd/system/lab-memlimit.service <<'EOF'
[Unit]
Description=Memory hog demo for cgroup lab
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/bash -c 'tail -f /dev/zero'
MemoryMax=64M
Restart=no

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
```

Проверьте синтаксис:

```bash
systemd-analyze verify lab-memlimit.service 2>&1 || true
```

---

## Задание 2. Запуск и статус

```bash
sudo systemctl start lab-memlimit
sleep 3
systemctl status lab-memlimit --no-pager
```

**Что увидите:** `failed` / `killed` / `oom-kill` — не `active (running)` стабильно.

```bash
journalctl -u lab-memlimit -n 20 --no-pager
```

Ищите: `Memory cgroup out of memory`, `Killed process`, `status=9/KILL`.

---

## Задание 3. cgroup файлы

```bash
CG=$(systemctl show lab-memlimit -p ControlGroup --value 2>/dev/null)
echo "ControlGroup=$CG"
sudo cat /sys/fs/cgroup${CG}/memory.current 2>/dev/null
sudo cat /sys/fs/cgroup${CG}/memory.max 2>/dev/null
```

**Что увидите:** `memory.max` ≈ 64M (67108864).

---

## Задание 4. Контрольный запуск без лимита (опционально)

```bash
sudo systemd-run --unit=lab-nolimit -- tail -f /dev/zero
sleep 2
systemctl status lab-nolimit --no-pager | head -10
sudo systemctl stop lab-nolimit
```

Без MemoryMax процесс живёт, пока не упрётся в RAM хоста — **не оставляйте** надолго.

---

## Задание 5. Уборка

```bash
sudo systemctl stop lab-memlimit 2>/dev/null
sudo systemctl disable lab-memlimit 2>/dev/null
sudo rm -f /etc/systemd/system/lab-memlimit.service
sudo systemctl daemon-reload
```

---

## Критерии успеха

- [ ] Сервис не работает стабильно выше 64M
- [ ] В journal есть признак OOM / kill
- [ ] Просмотрены memory.max / memory.current в cgroup
- [ ] Unit удалён после лабы

## Что унести в работу

- OOMKilled в K8s — сначала смотрите **limits.memory** и фактическое потребление.
- MemoryMax в systemd — для тяжёлых сервисов на VM.
- `Restart=always` + OOM = **crash loop** — алерт на restart count.

Следующий урок: [05. containerd](05-containerd.md).
