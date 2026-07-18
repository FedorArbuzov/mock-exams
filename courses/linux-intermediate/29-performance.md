# 29. top, vmstat, iostat

## Введение: «сервер тормозит» — CPU или диск?

Тикет: latency API выросла в 3 раза. Коллега открывает `top`, видит **20% CPU** и пишет «ресурсов хватает, масштабируйте приложение». Вы смотрите **%wa (iowait) 45%** и **iostat: %util 98%** — узкое место **диск**, не CPU. Масштабирование реплик только умножит нагрузку на тот же EBS.

Эта глава учит **читать** метрики ОС и отличать **CPU-bound**, **I/O-bound** и **memory pressure** — до профилирования Java/Go.

## Что вы узнаете

- **Load average** — что это на самом деле.
- **CPU bound** vs **I/O bound** vs **RAM/swap**.
- **top**, **vmstat**, **iostat**, **/proc/pressure**.
- Когда ставить пакет **sysstat** и как не перегрузить диск самим мониторингом.

---

## Load average — не «процент загрузки CPU»

```bash
uptime
#  14:32:01 up 3 days, load average: 2.10, 1.80, 1.50
```

Три числа — средняя длина очереди процессов в состояниях **runnable** и **uninterruptible sleep (D)** за 1, 5 и 15 минут.

| CPU cores | Load ~4.0 | Интерпретация |
|-----------|-----------|----------------|
| 4 | 4.0 | «в среднем заполнена очередь на все ядра» |
| 8 | 4.0 | запас есть |

Load **8** на 4 CPU **не всегда** катастрофа: короткие всплески или много процессов в **D** (ждут диск) поднимают load без 100% user CPU.

**Всегда смотрите вместе:** `%wa` в top, `vmstat`, `iostat`.

```bash
nproc
uptime
```

---

## top и htop — снимок «здесь и сейчас»

```bash
top
# клавиши: 1 — все CPU, M — sort по MEM, P — sort по CPU, H — потоки, q — выход
htop   # если установлен
```

**Строка CPU (пример):**

```text
%Cpu(s):  5.2 us,  2.1 sy,  0.0 ni, 72.3 id, 18.9 wa,  0.0 hi,  1.5 st
```

| Поле | Смысл |
|------|--------|
| us | user (приложения) |
| sy | kernel |
| id | idle |
| **wa** | **iowait** — CPU ждёт диск |
| st | steal (виртуализация, соседи по гипервизору) |

**Память:**

```text
MiB Mem:  7936 total,  1200 free,  3100 used,  3636 buff/cache
MiB Swap:  2048 total,  2048 free
```

**Swap used постоянно** — нехватка RAM или агрессивный swappiness; latency растёт.

**STAT процесса:**

| STAT | Значение |
|------|----------|
| R | running |
| S | sleeping |
| **D** | uninterruptible I/O (часто диск) |
| Z | zombie (родитель не wait) |

```bash
top -b -n 1 | head -20
ps aux --sort=-%cpu | head
ps aux --sort=-%mem | head
```

---

## vmstat — ритм раз в секунду

```bash
sudo apt install -y sysstat
vmstat 1 5
```

Пример вывода (сокращённо):

```text
procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
 r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
 2  1      0 500000  80000 2000000    0    0   120   450 800 1200 10  5 70 15  0
```

| Колонка | Смысл |
|---------|--------|
| **r** | runnable в очереди |
| **b** | blocked (часто I/O) |
| **si/so** | swap in/out — плохо, если стабильно > 0 |
| **bi/bo** | блоки read/write |
| **wa** | iowait % |

**Паттерн I/O bound:** низкий `us`, высокий **`wa`**, высокий **`b`**.

---

## iostat — диск по устройствам

```bash
iostat -xz 1 3
```

Ключевые поля (xfs/ext4 на SSD/NVMe):

| Поле | Смысл |
|------|--------|
| **%util** | занятость устройства (~100% = насыщение) |
| **await** | средняя задержка I/O (мс) |
| **r/s, w/s** | операции чтения/записи |

**Правило:** `%util` близко к 100% и `await` растёт — диск (или лимит cloud volume) — bottleneck.

```bash
lsblk
df -h
```

---

## /proc/pressure — PSI (современные ядра)

```bash
cat /proc/pressure/cpu 2>/dev/null
cat /proc/pressure/io 2>/dev/null
cat /proc/pressure/memory 2>/dev/null
```

Показывает, какую долю времени задачи **простаивали** из-за нехватки CPU/IO/memory. Удобно в Kubernetes при eviction и capacity planning.

---

## Связка: что делать после метрик

| Картина | Вероятное узкое место | Следующий шаг |
|---------|----------------------|---------------|
| us высокий, wa низкий | CPU | профиль app, больше CPU |
| wa высокий, %util 100% | диск | iotop, slow query, bigger/faster disk |
| si/so, мало free RAM | память | увеличить RAM, утечки, cache tuning |
| st высокий | гипервизор/соседи | сменить instance type, noisy neighbor |

В [лабе 30](30-lab-performance.md) вы **создадите** такие картины через `stress-ng`.

---

## Типичные ошибки

| Ошибка | Правда |
|--------|--------|
| load высокий = CPU 100% | может быть I/O (D state) |
| смотрят только top | добавьте vmstat + iostat |
| swap активен — «норма» | проверьте latency и si/so |
| iostat раз в час на диске | при инциденте — `1` сек интервал коротко |
| убили процесс с высоким CPU | мог быть symptom, не cause |

---

## В продакшене

Prometheus **node_exporter**, Grafana dashboards: CPU, memory, disk util, disk latency, network. Алерты на **disk util** и **memory**, не только CPU. Профилирование приложения (flame graph) — **после** доказательства bound на уровне ОС.

---

## Резюме

Диагностика производительности: определить **тип bound**, затем инструмент. Load — очередь, не проценты. **wa** и **iostat** — для диска. Swap — сигнал RAM.

## Чек-лист

- [ ] Load 8 на 4 CPU — всегда ли плохо?
- [ ] Где увидеть iowait в top и vmstat?
- [ ] Что значит %util ≈ 100% в iostat?
- [ ] Чем D-state в top связан с диском?

Следующий урок: [30. Лаба: stress](30-lab-performance.md).
