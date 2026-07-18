# 03. cgroups v2

## Введение: «поставили limits в YAML — pod OOMKilled»

В манифесте `resources.limits.memory: 256Mi`. Pod в статусе **OOMKilled**. На ноде это не «магия Kubernetes» — kubelet выставил **cgroup memory limit**, ядро убило процесс при превышении.

**cgroups** (control groups) — механизм ядра: **ограничивать** и **учитывать** CPU, память, I/O, PIDs. Namespaces изолируют «что видно»; cgroups — «сколько можно съесть».

## Что вы узнаете

- **cgroup v2** — единое дерево в `/sys/fs/cgroup`.
- Как **systemd** кладёт сервисы в cgroup.
- `MemoryMax`, `CPUQuota` в unit-файлах.
- Связь с `resources.limits` в Kubernetes.
- Что происходит при **OOM** в cgroup.

---

## cgroup v1 vs v2

| | v1 | v2 |
|---|-----|-----|
| Иерархия | несколько деревьев | **одно** дерево |
| Путь | `/sys/fs/cgroup/memory/...` | `/sys/fs/cgroup/` |
| systemd (современный) | v2 по умолчанию | |

Проверка:

```bash
mount | grep cgroup
ls /sys/fs/cgroup/
cat /sys/fs/cgroup/cgroup.controllers 2>/dev/null
```

---

## Дерево и контроллеры

```bash
cat /sys/fs/cgroup/cgroup.controllers
# memory pids cpu io ...
```

Дочерняя cgroup **наследует** лимиты родителя. Kubernetes создаёт иерархию вида `kubepods/podXXX/containerYYY`.

Просмотр памяти unit (пример):

```bash
systemctl status nginx 2>/dev/null | head -5
# путь cgroup в выводе или:
systemd-cgls | head -30
```

---

## systemd и cgroups

Каждый `systemctl start` → процессы в **slice/unit** cgroup:

```bash
systemctl show nginx -p ControlGroup --value 2>/dev/null
cat /sys/fs/cgroup/system.slice/nginx.service/memory.current 2>/dev/null
cat /sys/fs/cgroup/system.slice/nginx.service/memory.max 2>/dev/null
```

| Файл (v2) | Смысл |
|-----------|--------|
| `memory.current` | текущее использование |
| `memory.max` | лимит (max) |
| `memory.events` | oom, oom_kill |

---

## Лимиты в unit-файле

```ini
[Service]
MemoryMax=256M
CPUQuota=50%
TasksMax=100
```

```bash
sudo systemctl daemon-reload
sudo systemctl restart myservice
systemctl show myservice -p MemoryMax,CPUQuotaPerSecUSec
```

| Параметр | Эффект |
|----------|--------|
| MemoryMax | при превышении — OOM killer в cgroup |
| CPUQuota=50% | ~половина одного CPU |
| TasksMax | лимит процессов в unit |

---

## OOM в cgroup

При превышении **MemoryMax** ядро убивает процесс(ы) в cgroup — в journal:

```text
Memory cgroup out of memory
Killed process ... (oom_reaper)
```

В Kubernetes: `kubectl describe pod` → **Last State: Terminated, Reason: OOMKilled**.

**Важно:** limit без request — scheduling риск; limit ниже реального RSS — постоянные рестарты.

---

## Связь с Kubernetes

| K8s | cgroup (упрощённо) |
|-----|-------------------|
| `limits.memory` | memory.max |
| `limits.cpu` | cpu.max / quota |
| `requests` | scheduling, не жёсткий cap |

На ноде: `crictl inspect` / runtime spec → cgroup path.

---

## Типичные ошибки

| Симптом | Причина |
|---------|---------|
| сервис «молча» умирает | MemoryMax слишком низкий |
| CPU throttle 100% | CPUQuota низкий при высокой нагрузке |
| смотрят RAM хоста, не cgroup | процесс в контейнере/cgroup |
| TasksMax | fork bomb / утечка процессов |

---

## В продакшене

Версионируйте unit drop-in через Ansible. Для контейнеров — limits в манифесте + мониторинг **container_memory_working_set_bytes**. Node pressure — eviction до OOM pod.

---

## Резюме

**cgroups v2** — лимиты ресурсов. **systemd** — удобный интерфейс для bare metal. **OOMKilled** — почти всегда cgroup memory limit. Смотрите `/sys/fs/cgroup` и `systemctl show`.

## Чек-лист

- [ ] Где в ФС cgroup v2?
- [ ] Как ограничить память сервиса через systemd?
- [ ] Связь limits в K8s с OOMKilled?
- [ ] Чем MemoryMax отличается от отсутствия лимита?

Следующий урок: [04. Лаба: MemoryMax](04-lab-cgroups.md).
