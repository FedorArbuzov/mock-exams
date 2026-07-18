# Linux — Shell (специализация)

Bash для DevOps: **strict mode**, функции, **test/case**, **getopts**, **sed/awk**, **shellcheck**, healthcheck и скрипты для CI.

**После:** [linux-basic](../linux-basic/README.md) — файлы, права, systemd, базовый shell.

**Локально:** [`deploy/linux`](../../deploy/linux/README.md) — lab `172.28.0.10`, web `172.28.0.20`, srv1 `172.28.0.11`.

## Как читать курс

1. **Теория** (01, 03, 05…) — зачем в CI/на сервере, синтаксис, примеры, типичные ошибки.
2. **Лаба** (02, 04…) — пишете скрипт на lab, сверяете вывод и exit code.
3. Перед commit — **`shellcheck`** (уроки 13–14).
4. Примеры в [`examples/bin/`](examples/bin/README.md).

**Время:** ~45–60 минут на пару «теория + лаба»; [финал](16-final-project.md) — **2–4 часа**.

## Программа

| # | Теория | Лаба |
|---|--------|------|
| 01 | [Strict mode](01-bash-strict.md) | [02](02-lab-strict.md) |
| 03 | [Функции](03-functions.md) | [04](04-lab-functions.md) |
| 05 | [test / case](05-test-case.md) | [06](06-lab-test.md) |
| 07 | [getopts](07-getopts.md) | [08](08-lab-cli.md) |
| 09 | [sed](09-sed.md) | [10](10-lab-sed.md) |
| 11 | [awk](11-awk.md) | [12](12-lab-awk.md) |
| 13 | [shellcheck](13-shellcheck.md) | [14](14-lab-shellcheck.md) |
| 15 | [Healthcheck](15-healthcheck.md) | — |
| 16 | [Финальный проект](16-final-project.md) | |

## Что должно получиться

- Пишете bash с `set -euo pipefail` и осознанными `|| true`.
- Делите скрипт на функции с `local` и `main`.
- Парсите флаги через **getopts**.
- Правите конфиги **sed**, отчёты **awk**.
- Прогоняете **shellcheck** в CI перед merge.
- Собираете **check-host / deploy-smoke / log-report** для GitLab.

## Связь

| Курс | Связь |
|------|-------|
| [gitlab-basic](../gitlab-basic/README.md) | job `script:` вызывает ваши `.sh` |
| [linux-intermediate](../linux-intermediate/README.md) | curl, ssh, nginx на стенде |
| [linux-advanced](../linux-advanced/README.md) | deploy user, verify-node |
