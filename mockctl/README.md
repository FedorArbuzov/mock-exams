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
- `status` — `minikube status`, затем (если кластер живой) перевыгрузить `output/kubeconfig.yaml` и сделать `kubectl get nodes`. Перевыгрузка нужна, потому что после `down --soft` → `up` или рестарта Docker Desktop порт API-сервера в minikube может смениться, и старый kubeconfig перестанет работать.
- `kubeconfig` — пересохранить `output/kubeconfig.yaml` без полного `up`-цикла. Полезно, если кластер живой, а файл устарел.
- `web` — поднять локальный веб-сервер (`127.0.0.1`), который рендерит `courses/*.md` в HTML прямо на лету (заголовки, таблицы, код, ссылки между уроками) и открывает браузер. Флаги: `--port` (по умолчанию `8091`), `--courses-dir` (по умолчанию `./courses`), `--no-open` (не открывать браузер автоматически). По умолчанию курсы читаются с диска (правки в `.md` видны сразу после F5, без пересборки). Есть опциональная сборка с курсами внутри бинарника — см. [«Автономный бинарник с курсами»](#автономный-бинарник-с-курсами-embed).
- `version`, `help`.

## Использование

После установки бинарника `mockctl` (см. ниже) — из корня репозитория:

```text
mockctl install
mockctl up
mockctl status
mockctl kubeconfig    # если status пожаловался на connection refused
mockctl web           # открыть браузер с курсами на http://127.0.0.1:8091
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

### Автономный бинарник с курсами (embed)

Обычная сборка читает `courses/` **с диска** — это удобно для разработки (live-reload, лёгкий бинарник ~8 МБ), но `mockctl web` работает только из корня репозитория. Если нужно раздать **один самодостаточный файл**, который показывает курсы **без репозитория**, собери с курсами, вшитыми внутрь (`-tags embed`):

```cmd
mockctl\build-embed-docker.cmd
```

```bash
cd mockctl
chmod +x build-embed.sh
./build-embed.sh
```

Артефакты — с суффиксом `-embed` в `mockctl/dist/` (например `mockctl-windows-amd64-embed.exe`, ~18 МБ). У такого бинарника `mockctl web` отдаёт вшитые курсы из любого каталога; `--courses-dir` по-прежнему переопределяет источник на диск.

Как это устроено:

- `go:embed` не умеет тянуть файлы выше своего модуля (`../courses`), поэтому скрипты сборки временно копируют `courses/` в `mockctl/courses/` (в `.gitignore`) и удаляют копию после сборки.
- При копировании вырезаются `node_modules`, виртуалки, кэши и build-артефакты из примеров (иначе бинарник раздувался бы до ~190 МБ вместо ~18 МБ).
- Переключение режимов — через build-tag: `embed_off.go` (по умолчанию, чтение с диска) и `embed_on.go` (`-tags embed`, вшитая копия).

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
- `smoke` — быстрый дым-тест бинарников (`version`, `help`, `status`) в матрице `ubuntu-latest` + `windows-latest`. На Windows запуск идёт через Git Bash для кросс-платформенных шагов.
- `e2e-linux` — полный сценарий с реальным minikube на `ubuntu-latest`: `install` → `up --no-addons` → `kubectl get nodes` → деплой `nginx` → `down --soft` → `uninstall --yes`. На падении прикладывает `minikube logs`. На `windows-latest` e2e не запускаем: на дефолтном Windows-раннере Docker работает в Windows-containers режиме, поднять minikube с `docker`-driver там не получится в разумное время.

Workflow запускается на push/PR в файлы `mockctl/**` и сам workflow, плюс по кнопке `workflow_dispatch`. Аддоны (`metrics-server`/`ingress`) в e2e отключены сознательно — они заметно увеличивают время и могут флакать на медленном пуле образов.
