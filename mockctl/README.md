# mockctl

[![mockctl](https://github.com/OWNER/REPO/actions/workflows/mockctl.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/mockctl.yml)

Маленькая CLI на Go, которая заменяет старые `.ps1`/`.sh` скрипты. Кросс-платформенная: один бинарник под каждую ОС, без Python/PowerShell.

Что умеет:

- `install` — установить **minikube** и **kubectl**:
  - Windows: через `winget`.
  - macOS: через `brew`.
  - Linux: скачивает официальные бинарники в `~/.local/bin` (без sudo). Поддержаны `amd64`, `arm64`, `arm`. Каталог можно переопределить через `MOCKCTL_INSTALL_DIR`.
- `up` — запустить minikube-кластер `mock-exams` на драйвере `docker`, включить аддоны **metrics-server** и **ingress**, выгрузить kubeconfig в `output/kubeconfig.yaml`.
- `down` — удалить профиль minikube. Флаг `--soft` делает `minikube stop` вместо `delete`: состояние ноды сохраняется и следующий `up` поднимется за 15–30 секунд (вместо 1.5–2 минут).
- `clean` — удалить кластер и очистить `output/`. Флаг `--full` дополнительно сносит `~/.minikube`.
- `uninstall` — снести всё начисто: все профили minikube, `~/.minikube`, `~/.kube`, очистить `output/` и удалить сами бинарники `minikube` и `kubectl` (через `winget`/`brew`/из `~/.local/bin`). Флаги:
  - `--yes` — без интерактивного подтверждения.
  - `--keep-tools` — не трогать бинарники `minikube`/`kubectl`.
- `status` — `minikube status` + `kubectl get nodes`.
- `version`, `help`.

## Использование

После установки бинарника `mockctl` (см. ниже) — из корня репозитория:

```text
mockctl install
mockctl up
mockctl status
mockctl down
mockctl clean --full
mockctl uninstall --yes
```

Имя профиля по умолчанию — `mock-exams`. Поменять можно через переменную окружения **`MOCKCTL_PROFILE`**.

## Сборка

### Локально (нужен установленный Go)

```cmd
mockctl\build.cmd
```

```bash
cd mockctl
chmod +x build.sh
./build.sh
```

### Через Docker (Go не нужен)

```cmd
mockctl\build-docker.cmd
```

```bash
cd mockctl
chmod +x build-docker.sh
./build-docker.sh
```

Артефакты в `mockctl/dist/`:

- `mockctl-windows-amd64.exe`
- `mockctl-linux-amd64`
- `mockctl-linux-arm64`
- `mockctl-darwin-amd64`
- `mockctl-darwin-arm64`

## Что делает бинарник внутри

`mockctl` сам не реализует Kubernetes. Это «пульт» поверх уже установленных утилит:

- На Windows: `winget`, `minikube`, `kubectl` — ищется в PATH и в типичных местах (`C:\Program Files\Kubernetes\Minikube\` и т.п.).
- На macOS: `brew`, `minikube`, `kubectl` — ищется в PATH, `/opt/homebrew/bin`, `/usr/local/bin`.
- На Linux: `~/.local/bin`, `/usr/local/bin`, `/usr/bin`. После `mockctl install` каталог `~/.local/bin` нужно один раз добавить в PATH (mockctl выведет команду).

Для запуска `mockctl up` нужен **запущенный Docker Desktop** — `mockctl` это проверяет (`docker info`).

## Где брать бинарники пользователю

Идея: распространять готовый `mockctl-*-*.exe` через релизы (GitHub Releases / другой канал). Пользователь скачивает один файл под свою ОС и запускает. Локального Go и PowerShell ему не нужно.

## CI

В `.github/workflows/mockctl.yml` настроены три job-а:

- `build` — `go vet` + кросс-компиляция всех 5 бинарников, артефакты складываются в `mockctl-binaries`.
- `smoke-linux` — быстрый дым-тест Linux-бинарника (`version`, `help`, `status`).
- `e2e-linux` — полный сценарий с реальным minikube на `ubuntu-latest`: `install` → `up --no-addons` → `kubectl get nodes` → деплой `nginx` → `down --soft` → `uninstall --yes`. На падении прикладывает `minikube logs`.

Workflow запускается на push/PR в файлы `mockctl/**` и сам workflow, плюс по кнопке `workflow_dispatch`. Аддоны (`metrics-server`/`ingress`) в e2e отключены сознательно — они заметно увеличивают время и могут флакать на медленном пуле образов.
