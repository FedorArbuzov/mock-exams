# 22. Лаба: наблюдаемость — strace и /proc

## Цель лабы

Проверить доступность **bcc**; если нет — выполнить **strace -c** и **PSI** (`/proc/pressure/*`); записать trade-offs observability в заметки.

## Предварительно

- [21. eBPF intro](21-ebpf-intro.md).
- lab, sudo.

```bash
docker compose exec lab bash
sudo apt install -y strace 2>/dev/null
```

---

## Задание 1. Доступность bcc

```bash
apt search bpfcc 2>/dev/null | head -8
which opensnoop-bpfcc biolatency-bpfcc 2>/dev/null || echo "bcc not installed — use strace/PSI"
```

---

## Задание 2. opensnoop (если есть)

**Терминал A:**

```bash
sudo timeout 5 opensnoop-bpfcc 2>/dev/null | head -20
```

**Терминал B:**

```bash
ls /etc > /dev/null
cat /etc/hosts > /dev/null
```

**Что увидите:** COMM и FILE при bcc.

---

## Задание 3. strace — статистика syscalls

```bash
strace -c -o /tmp/strace-c.txt ls -la /etc >/dev/null
head -20 /tmp/strace-c.txt
```

**Зачем:** быстрый профиль «куда уходит время» без полного лога.

---

## Задание 4. Pressure Stall Information

```bash
cat /proc/pressure/cpu 2>/dev/null || echo "PSI not available in this container"
cat /proc/pressure/io 2>/dev/null || true
cat /proc/pressure/memory 2>/dev/null || true
```

На реальной K8s-ноде PSI полезен при eviction.

---

## Задание 5. Заметки trade-offs

```bash
tee /tmp/observability-notes.txt <<'EOF'
Metrics (Prometheus): always-on, aggregates, low detail
strace: high detail, high cost, short sessions
eBPF/bcc: middle ground, needs packages/kernel
auditd: security config changes, not performance
When disk slow: iostat + biolatency, not only top CPU
EOF
cat /tmp/observability-notes.txt
```

---

## Критерии успеха

- [ ] strace -c выполнен
- [ ] PSI прочитан или зафиксировано «нет в container»
- [ ] `/tmp/observability-notes.txt` заполнен
- [ ] opensnoop — если bcc был; иначе осознанный skip

## Что унести в работу

- Выбор инструмента по вопросу: security vs perf vs syscall debug.
- [linux-intermediate: strace](../linux-intermediate/32-lab-strace.md) — углубление.

Следующий урок: [23. Capacity и runbooks](23-capacity-runbooks.md).
