# 09. Лаба: процессы и сигналы

## Стенд

`docker compose exec lab bash`

---

## Задание 1. Дерево и PID 1

```bash
ps -p 1 -o pid,cmd
ps -ef --forest | head -25
```

---

## Задание 2. Фон и jobs

```bash
sleep 300 &
jobs -l
kill %1
jobs
```

**Что увидите:** job исчез после kill.

---

## Задание 3. SIGTERM vs SIGKILL

```bash
sleep 600 &
SPID=$!
kill $SPID
sleep 1
ps -p $SPID

sleep 600 &
SPID=$!
kill -9 $SPID
ps -p $SPID
```

Второй процесс не должен отображаться в `ps`.

---

## Задание 4. nice

```bash
nice -n 15 sleep 120 &
ps -o pid,ni,cmd -p $!
```

**Что увидите:** NI = 15.

---

## Задание 5. top snapshot

```bash
top -b -n 1 | head -12
```

Запишите load average из первой строки.

---

## Критерии успеха

- [ ] Показан PID 1
- [ ] Фоновый sleep убит через kill
- [ ] nice 15 виден в колонке NI

Следующий урок: [10. systemd](10-systemd.md).
