# mockctl

[![mockctl](https://github.com/OWNER/REPO/actions/workflows/mockctl.yml/badge.svg)](https://github.com/OWNER/REPO/actions/workflows/mockctl.yml)

Маленькая CLI на Go, которая заменяет старые `.ps1`/`.sh` скрипты. Кросс-платформенная: один бинарник под каждую ОС, без Python/PowerShell.

Что умеет:

- `install` — установить **minikube** и **kubectl**:
  - Windows: через `winget`.
  - macOS: через `brew`.
  - Linux: скачивает официальные бинарники в `~/.local/bin` (без sudo). Поддержаны `amd64`, `arm64`, `arm`. Каталог можно переопределить через `MOCKCTL_INSTALL_DIR`.
- `up` — запустить minikube-кластер `mock-exams` на драйвере `docker`, включить аддоны **metrics-server** и **ingress**, выгрузить kubeconfig в `output/kubeconfig.yaml`. Флаги:
  - `--no-addons` — не включать metrics-server/ingress.
  - `--nodes N` — число нод (по умолчанию `1`). Для финального проекта `kuber-basic`: `--nodes 2`. Смена числа нод обычно требует `mockctl down` и новый `up`.
  - `--lb` — edge load balancer: docker-контейнер `mockctl-lb` (nginx) на `localhost:8080` (или `--lb-port`) → **nodeIP:32080** на каждой ноде. Ingress Controller Service должен слушать **nodePort 32080** (порт 80). Без контроллера на этом порту — HTTP **502**.
  - `--gitlab` — поднять **GitLab CE + runner** из [`deploy/gitlab/docker-compose.yml`](../deploy/gitlab/docker-compose.yml): UI на **`http://localhost:8929`**, SSH на `2222`. Одна нода minikube (флаг `--nodes` игнорируется). После старта GitLab ждёт готовности (первый запуск 5–15 мин) и **автоматически регистрирует** runner с тегами `docker`, `local` (если ещё не зарегистрирован). Нужно **8+ GB RAM** комфортно. `mockctl down` / `clean` / `uninstall` останавливают GitLab (volumes сохраняются).
- `down` — удалить профиль minikube. Флаг `--soft` делает `minikube stop` вместо `delete`: состояние ноды сохраняется и следующий `up` поднимется за 15–30 секунд (вместо 1.5–2 минут). Также останавливает LB и GitLab.
- `clean` — удалить кластер и очистить `output/`. Флаг `--full` дополнительно сносит `~/.minikube`.
- `uninstall` — снести всё начисто: все профили minikube, `~/.minikube`, `~/.kube`, очистить `output/` и удалить сами бинарники `minikube` и `kubectl` (через `winget`/`brew`/из `~/.local/bin`). Флаги:
  - `--yes` — без интерактивного подтверждения.
  - `--keep-tools` — не трогать бинарники `minikube`/`kubectl`.
- `status` — `minikube status`, затем (если кластер живой) перевыгрузить `output/kubeconfig.yaml` и сделать `kubectl get nodes`. Если GitLab / LocalStack запущены — краткие блоки в конце. Перевыгрузка нужна, потому что после `down --soft` → `up` или рестарта Docker Desktop порт API-сервера в minikube может смениться, и старый kubeconfig перестанет работать.
- `localstack` — **без Kubernetes**: поднять/остановить AWS-эмулятор для [`aws-terraform`](../courses-en/aws-terraform/README.md) из [`deploy/localstack`](../deploy/localstack/README.md):
  - `mockctl localstack up` — `docker compose up -d` + ожидание health на **`http://localhost:4566`**
  - `mockctl localstack down` — остановить контейнеры (volumes сохраняются); не вызывается из `mockctl down`
  - `mockctl localstack status` — health check
- `kubeconfig` — пересохранить `output/kubeconfig.yaml` без полного `up`-цикла. Полезно, если кластер живой, а файл устарел.
- `web` — поднять локальный веб-сервер (`127.0.0.1`), который рендерит `courses-en/*.md` в HTML прямо на лету (заголовки, таблицы, код, ссылки между уроками) и открывает браузер. Флаги: `--port` (по умолчанию `8091`), `--courses-dir` (по умолчанию `./courses-en`), `--no-open` (не открывать браузер автоматически). По умолчанию курсы читаются с диска (правки в `.md` видны сразу после F5, без пересборки). Русская версия: `--courses-dir ./courses`. Есть опциональная сборка с курсами внутри бинарника — см. [«Автономный бинарник с курсами»](#автономный-бинарник-с-курсами-embed).
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

Для финального проекта Kubernetes Basic (голые ноды + edge LB на фиксированный NodePort **32080**):

```text
mockctl down
mockctl up --nodes 2 --no-addons --lb
# curl http://localhost:8080/  → 502 пока Ingress Controller не слушает :32080
```

Для курсов GitLab CI/CD (одна нода + GitLab + LB для review/staging URL):

```text
mockctl up --gitlab --lb
# GitLab: http://localhost:8929
# LB:     http://localhost:8080
# Course: courses-en/gitlab-cicd
```

Для AWS + Terraform (LocalStack, **без** minikube):

```text
mockctl localstack up
# Endpoint: http://localhost:4566
# Course:   courses-en/aws-terraform
mockctl localstack status
mockctl localstack down
```

Имя профиля по умолчанию — `mock-exams`. Поменять можно через переменную окружения **`MOCKCTL_PROFILE`**.

## Интерактивные лабы

Урок-лаба может проверяться прямо в браузере. Если рядом с `.md`-файлом урока лежит одноимённый файл `*.lab.json`, `mockctl web` показывает внизу страницы панель **Interactive lab** с тремя кнопками:

- **Start lab** — подготовить кластер к заданию (создать namespace, убрать/засеять целевые ресурсы).
- **Check** — проверить состояние живого кластера и выдать вердикт по каждому пункту (✔/✖) плюс общий PASSED / Not there yet.
- **Cleanup** — удалить ресурсы **этой** лабы. Кластер продолжает работать для следующих лаб.

Требуется поднятый кластер (`mockctl up`) — движок ходит в него через `kubectl` и `output/kubeconfig.yaml`.

Определение лабы — это данные, а не код: движок (`internal/lab`) читает `*.lab.json` из того же источника, что и веб (диск или вшитая копия при сборке `-tags embed`), поэтому новые лабы добавляются без пересборки бинарника. Схема файла:

```json
{
  "id": "kuber-basic/07-lab-pods",
  "title": "Lab: Pods",
  "setup":   [ { "op": "delete", "kind": "pod", "namespace": "default", "name": "web" } ],
  "checks":  [ { "type": "image", "kind": "pod", "namespace": "default", "name": "web", "value": "nginx:1.27", "desc": "..." } ],
  "cleanup": [ { "op": "delete", "kind": "pod", "namespace": "default", "name": "web" } ]
}
```

- `setup`/`cleanup` op: `apply` (манифест YAML из дерева курсов, `"manifest": "<fs-путь>"`), `delete` (kind/name/namespace), `ensureNamespace`, `deleteNamespace`.
- `checks` type: `exists`, `running`, `image`, `replicas`, `ready`, `label` (+`key`/`value`), `env` (+`key`/`value`).

Первый пример — [`courses-en/kuber-basic/07-lab-pods.lab.json`](../courses-en/kuber-basic/07-lab-pods.lab.json).

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

Обычная сборка читает `courses-en/` **с диска** — это удобно для разработки (live-reload, лёгкий бинарник ~8 МБ), но `mockctl web` работает только из корня репозитория. Если нужно раздать **один самодостаточный файл**, который показывает курсы **без репозитория**, собери с курсами, вшитыми внутрь (`-tags embed`):

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

- `go:embed` не умеет тянуть файлы выше своего модуля (`../courses-en`), поэтому скрипты сборки временно копируют `courses-en/` в `mockctl/courses/` (в `.gitignore`) и удаляют копию после сборки.
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
