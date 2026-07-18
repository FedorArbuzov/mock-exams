# 21. eBPF и bcc-tools (intro)

## Введение: strace тормозит prod, а ответ нужен сейчас

**strace** на каждый syscall — дорого на high-QPS. **eBPF** — программы в ядре Linux (верифицированные) для **наблюдаемости** и сети с низким overhead: кто открыл файл, латентность диска, DNS в pod.

В K8s: **Cilium**, **Pixie**, **bpftrace** на ноде — всё eBPF под капотом или рядом.

## Что вы узнаете

- Что такое **eBPF** в двух словах.
- **bcc-tools** и **bpftrace** (обзор).
- Когда eBPF vs strace vs metrics.
- Почему в lab пакетов может не быть.

---

## eBPF — идея

```mermaid
flowchart LR
  event[Kernel event]
  prog[eBPF program]
  map[maps / perf buffer]
  user[userspace tool]
  event --> prog
  prog --> map
  map --> user
```

- Загрузка программы в ядро с **проверкой безопасности** (bounded loops, no arbitrary memory).
- Hooks: syscalls, tracepoints, kprobes, network (XDP).
- **Не** перекомпиляция ядра для каждого инструмента.

---

## bcc / bpftrace (если установлены)

```bash
sudo opensnoop-bpfcc    # кто открывает файлы
sudo biolatency-bpfcc   # гистограмма латентности диска
sudo execsnoop-bpfcc    # новые процессы
```

**bpftrace** one-liner:

```bash
sudo bpftrace -e 'tracepoint:syscalls:sys_enter_openat {
  printf("%s %s\n", comm, str(args->filename));
}'
```

В учебном Docker-образе пакеты часто **отсутствуют** — достаточно понимать **назначение**; практика — [лаба 22](22-lab-bcc.md) со strace и PSI.

---

## Когда что использовать

| Задача | Инструмент |
|--------|------------|
| «Кто открыл /etc/shadow» | opensnoop, auditd |
| Медленный диск | biolatency, iostat |
| Молчаливый exit app | strace (коротко) |
| Сеть pod/service | Cilium hubble, tcpdump |
| 24/7 prod | Prometheus metrics + eBPF sampling |

**strace на prod 24/7** — нет. **eBPF** — короткие сессии или постоянные легковесные агенты.

---

## Связь с Kubernetes

- **Cilium** — network policies + observability (eBPF dataplane).
- **kubectl debug node** — иногда bpftrace в privileged debug pod.
- Sidecar service mesh — другой слой, не замена node-level disk latency.

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| eBPF на старом ядре | инструменты не ставятся |
| нет CAP_BPF / root | permission denied |
| путать с DTrace на macOS | другой API |

---

## В продакшене

Согласование security на загрузку BPF. CO-RE (compile once run everywhere) в современных инструментах. Обучение SRE: bpftrace для 5-минутной диагностики.

---

## Резюме

**eBPF** — наблюдаемость в ядре с меньшим overhead, чем strace. **bcc/bpftrace** — lab tools. Метрики — baseline; eBPF — углублённая диагностика.

## Чек-лист

- [ ] Чем eBPF полезен DevOps?
- [ ] Почему не strace на всём prod 24/7?
- [ ] Назовите один bcc-tool и его задачу.

Следующий урок: [22. Лаба: bcc](22-lab-bcc.md).
