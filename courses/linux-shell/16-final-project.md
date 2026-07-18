# 16. Финальный проект: bin/ для CI

## Введение: три скрипта вместо магии в .gitlab-ci.yml

Длинный `script:` в YAML не review'ится, не тестируется shellcheck локально, дублируется между проектами. **Финал** — вынести логику в `courses/linux-shell/examples/bin/` и вызывать из GitLab CI как из [gitlab-basic](../gitlab-basic/README.md).

**Время:** 2–4 часа.

## Цель

Собрать **три** bash-скрипта + обновлённый **README**, проходящие **shellcheck** и smoke на стенде `deploy/linux`.

---

## Скрипт 1: check-host.sh

| Проверка | Реализация |
|----------|------------|
| TCP 22 (или 80) | `/dev/tcp` + timeout |
| disk root < 90% | `df` + awk |
| load average | `uptime` или `/proc/loadavg` |

**Вывод:** строки `key=value` для артефактов CI:

```text
host=172.28.0.11
tcp_22=ok
disk_root_pct=42
load_1m=0.15
status=ok
```

```bash
./check-host.sh 172.28.0.11
echo "exit=$?"
```

**Требования:** strict mode, функции, `local`, usage при пустом HOST.

---

## Скрипт 2: deploy-smoke.sh

| Элемент | Требование |
|---------|------------|
| CLI | **getopts** `-e ENV -H HOST [-n]` |
| HTTP | curl 200 на `http://HOST/` |
| SSH | `systemctl is-active nginx` (или ваш unit) |
| dry-run | `-n` — только echo, без ssh |

```bash
./deploy-smoke.sh -e lab -H 172.28.0.11
./deploy-smoke.sh -e lab -H 172.28.0.11 -n
```

---

## Скрипт 3: log-report.sh

| Элемент | Требование |
|---------|------------|
| Источник | `journalctl --since "1 hour ago"` или файл |
| awk | count error / warn (END block) |
| sed | опционально: нормализация timestamp |
| Выход | `/tmp/report-${HOST}.txt` или stdout |

```bash
./log-report.sh 172.28.0.11
head -20 /tmp/report-172.28.0.11.txt
```

---

## Требования к качеству

| # | Требование |
|---|------------|
| 1 | `#!/usr/bin/env bash` + `set -euo pipefail` |
| 2 | Функции + **`local`** |
| 3 | **`shellcheck`** без errors на всех трёх |
| 4 | **`usage()`** при неверных аргументах |
| 5 | [README](examples/bin/README.md) с примерами вызова |
| 6 | Не хранить секреты в скриптах |

---

## GitLab CI (пример)

```yaml
stages:
  - lint
  - smoke

lint-shell:
  stage: lint
  script:
    - apt-get update && apt-get install -y shellcheck
    - shellcheck courses/linux-shell/examples/bin/*.sh

smoke-linux:
  stage: smoke
  script:
    - apt-get update && apt-get install -y curl openssh-client
    - bash courses/linux-shell/examples/bin/check-host.sh 172.28.0.11
    - bash courses/linux-shell/examples/bin/deploy-smoke.sh -e lab -H 172.28.0.11 -n
```

Для реального ssh — runner с ключом и доступом к `172.28.0.0/24`.

---

## Пошаговый план

1. Скопировать заготовки из лаб 04, 08, 12 или расширить существующие `healthcheck.sh` / `strict-demo.sh`.
2. `shellcheck` → исправить.
3. Прогон на lab против web/srv1.
4. Обновить README.
5. (Опционально) добавить job в свой `.gitlab-ci.yml`.

---

## Критерии сдачи

- [ ] 3 скрипта в `examples/bin/`
- [ ] README с примерами
- [ ] `shellcheck *.sh` — exit 0
- [ ] `check-host` и `deploy-smoke -n` проходят на стенде
- [ ] `log-report` создаёт файл с error/warn counts

---

## Связь

| Курс | Связь |
|------|-------|
| [linux-basic](../linux-basic/README.md) | ssh, systemd |
| [gitlab-intermediate](../gitlab-intermediate/README.md) | deploy stages |
| [linux-advanced](../linux-advanced/26-deploy-user.md) | пользователь deploy |

---

## Резюме

Финал объединяет **strict**, **functions**, **getopts**, **awk/sed**, **shellcheck**, **healthcheck** в набор для CI. Качество = shellcheck + smoke на lab + документация.
