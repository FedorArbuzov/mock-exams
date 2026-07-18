# 30. Лаба: stress и метрики

## Цель лабы

Создать **контролируемую** нагрузку CPU и I/O и увидеть отражение в **top**, **vmstat** и **iostat** — чтобы на проде не гадать «тормозит из-за CPU или диска».

После лабы вы сможете сказать: «это похоже на наш инцидент — высокий wa, не user CPU».

## Предварительно

- [29. Performance](29-performance.md).
- lab, sudo, 5–10 минут без других тяжёлых stress на той же VM.

```bash
docker compose exec lab bash
sudo apt update
sudo apt install -y sysstat stress-ng
```

---

## Подготовка стенда

```bash
nproc
uptime
free -h
```

Запишите в блокнот: **cores**, **load**, **free Mem**, **Swap used**.

---

## Задание 1. Baseline (до нагрузки)

**Зачем:** с чем сравнивать «после».

```bash
vmstat 1 3
top -b -n 1 | head -12
```

Запишите: **load**, колонку **wa** в vmstat, **%Cpu id** в top.

---

## Задание 2. CPU stress

**Зачем:** увидеть рост **us** и load без обязательного роста wa.

```bash
stress-ng --cpu 2 --timeout 25s &
STRESS_PID=$!
sleep 3
top -b -n 1 | head -15
uptime
wait $STRESS_PID 2>/dev/null
```

**Что увидите:**

- процессы `stress-ng` с высоким **%CPU**;
- **load average** растёт (примерно к числу нагруженных CPU);
- **wa** обычно остаётся низким.

```bash
grep '^%Cpu' <(top -b -n 1 | head -5)
```

**Если load не растёт:** мало времени stress — увеличьте `--timeout 40s`.

---

## Задание 3. Сравнение: vmstat под CPU load

```bash
stress-ng --cpu 2 --timeout 20s &
sleep 2
vmstat 1 5
wait
```

| Ожидание | Колонки |
|----------|---------|
| CPU bound | **r** > 0, **us** высокий, **wa** низкий |

---

## Задание 4. I/O stress

**Зачем:** отличить I/O bound от CPU bound.

```bash
stress-ng --hdd 1 --hdd-bytes 120M --timeout 18s &
sleep 2
vmstat 1 6
wait
```

**Что увидите:** рост **wa**, иногда **b**; **bi/bo** скачут.

**Если wa не растёт:** диск очень быстрый (tmpfs) — всё равно зафиксируйте **bi/bo**.

---

## Задание 5. iostat

```bash
iostat -xz 1 3 2>/dev/null
```

Во время повторного короткого stress (опционально):

```bash
stress-ng --hdd 1 --hdd-bytes 80M --timeout 12s &
sleep 1
iostat -xz 1 4
wait
```

Ищите **%util** и **await** на устройстве с активностью.

---

## Задание 6. Мини-отчёт (в тетрадь)

Заполните таблицу своими числами:

| Состояние | load (1 min) | wa (vmstat) | top us | Вывод |
|-----------|--------------|-------------|--------|-------|
| baseline | | | | |
| CPU stress | | | | CPU bound |
| I/O stress | | | | I/O bound |

---

## Задание 7. PSI (опционально)

```bash
cat /proc/pressure/cpu 2>/dev/null
cat /proc/pressure/io 2>/dev/null
```

Сравните «some» строки до и во время stress.

---

## Критерии успеха

- [ ] Зафиксирован load до и после CPU stress
- [ ] В top видны процессы stress-ng с высоким %CPU
- [ ] При I/O stress заметен рост wa или bi/bo в vmstat
- [ ] Таблица «baseline vs stress» заполнена

## Что унести в работу

- Перед scale-out — **доказать** bound (CPU vs I/O vs RAM).
- Высокий load + высокий wa → не добавлять CPU, смотреть диск/БД.
- stress-ng — только на staging/lab, не на prod без согласования.

Следующий урок: [31. strace](31-strace-lsof.md).
