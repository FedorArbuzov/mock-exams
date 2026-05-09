# Mock exams — локальный запуск

Всё работает на вашем компьютере: отдельный платный Kubernetes не нужен. Сначала ставятся **Docker**, **minikube** и **kubectl**, затем поднимается кластер и (по желанию) приложение в Docker.

> Для удобства есть **`mockctl`** — единый CLI на Go, заменяющий все скрипты в `scripts/`.
> См. [`INSTALL.md`](INSTALL.md) для коротких команд под каждую ОС и [`mockctl/`](mockctl/README.md) для подробностей.
> Если используете его — все шаги ниже превращаются в `mockctl install` и `mockctl up`.

---

## Инструкция для Windows

### Шаг 1. Docker Desktop

1. Установите [Docker Desktop для Windows](https://www.docker.com/products/docker-desktop/).
2. Запустите Docker Desktop и дождитесь, пока он станет «Running».

### Шаг 2. Установить minikube и kubectl

**Вариант А — автоматически (нужен `winget`)**

1. Откройте терминал (PowerShell или cmd) в **корне этого репозитория**.
2. Выполните:
   ```cmd
   scripts\install-minikube.cmd
   ```
3. Если в конце видите версии `minikube` и `kubectl` — переходите к шагу 3.
4. Если терминал пишет, что не находит `minikube` или `kubectl` — **закройте терминал, откройте новый** и снова выполните проверку:
   ```powershell
   minikube version
   kubectl version --client
   ```

**Вариант Б — вручную (если `winget` нет или скрипт не сработал)**  
Перейдите к разделу [Если нет winget](#если-нет-winget-или-скрипт-установки-не-работает), затем вернитесь сюда и выполните проверку команд из пункта 4 выше.

### Шаг 3. Поднять кластер и kubeconfig

1. В корне репозитория выполните:
   ```cmd
   scripts\minikube-up.cmd
   ```
2. Дождитесь сообщения об успехе и строки про файл `output\kubeconfig.yaml`.

### Шаг 4. Проверить кластер

В PowerShell из корня репозитория:

```powershell
kubectl --kubeconfig .\output\kubeconfig.yaml get nodes
kubectl --kubeconfig .\output\kubeconfig.yaml get pods -A
```

Узел должен быть в статусе **Ready**, системные поды — без постоянного **CrashLoopBackOff**.

### Шаг 5. Запустить приложение в Docker (по желанию)

Пока кластер запущен и файл `output\kubeconfig.yaml` существует:

```powershell
docker compose up --build
```

Приложение будет доступно на порту **8080** (как настроено в `docker-compose.yml`).

---

## Инструкция для macOS

Используются bash-скрипты в `scripts/*.sh`. Один раз выдайте им право на запуск:

```bash
chmod +x scripts/*.sh
```

### Шаг 1. Docker Desktop

1. Установите [Docker Desktop для Mac](https://www.docker.com/products/docker-desktop/).
2. Запустите Docker и дождитесь готовности.

### Шаг 2. Установить minikube и kubectl

Нужен **[Homebrew](https://brew.sh)** (`brew`). Если его ещё нет — установите по инструкции на сайте, затем:

```bash
./scripts/install-minikube.sh
```

Переустановка «с нуля» (снять формулы и поставить снова):

```bash
./scripts/install-minikube.sh --reinstall
```

Без Homebrew можно поставить вручную: [minikube — Start](https://minikube.sigs.k8s.io/docs/start/) и [kubectl для macOS](https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/).

### Шаг 3. Поднять кластер и kubeconfig

Из корня репозитория:

```bash
./scripts/minikube-up.sh
```

Появится `output/kubeconfig.yaml`.

### Шаг 4. Проверить кластер

```bash
kubectl --kubeconfig ./output/kubeconfig.yaml get nodes
kubectl --kubeconfig ./output/kubeconfig.yaml get pods -A
```

### Шаг 5. Запустить приложение в Docker

```bash
docker compose up --build
```

---

## Если нет winget или скрипт установки не работает

### 1. Убедитесь, что речь про `winget`, а не про `wget`

- **`winget`** — установщик пакетов Windows (Windows Package Manager).
- **`wget`** — другая утилита (часто из Git или алиас в PowerShell). **Она не ставит minikube.**

Проверка:

```powershell
winget --version
```

Если команда не находится — `winget` не установлен. Дальше — пункт 2 или 3.

### 2. Поставить winget (приложение «App Installer»)

`winget` поставляется вместе с **App Installer** из Microsoft Store.

1. Откройте в браузере:  
   https://apps.microsoft.com/detail/9nblggh4nns1  
2. Нажмите **Установить** / **Получить**.
3. После установки **полностью закройте терминал**, откройте новый и снова выполните `winget --version`.

Поиск в меню «Пуск» по словам *App Installer* иногда ничего не находит — это не значит, что установщика нет; удобнее ставить по ссылке выше.

**Если Microsoft Store недоступен** — скачайте установщик с релизов Microsoft:  
https://github.com/microsoft/winget-cli/releases  

После появления `winget` снова запустите `scripts\install-minikube.cmd`.

### 3. Обойтись без winget: установить minikube и kubectl вручную

1. **minikube** — официальная инструкция для Windows:  
   https://minikube.sigs.k8s.io/docs/start/  
   Скачайте установщик, поставьте программу, убедитесь, что `minikube` доступен в новом терминале.

2. **kubectl** — инструкция Microsoft / Kubernetes:  
   https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/  

3. Добавьте каталоги с `minikube.exe` и `kubectl.exe` в переменную среды **PATH** пользователя (Параметры → Система → О программе → Дополнительные параметры → Переменные среды), либо перезапустите установщики с опцией «добавить в PATH», если она есть.

4. Откройте **новый** терминал и проверьте:

   ```powershell
   minikube version
   kubectl version --client
   ```

Дальше выполняйте [шаг 3](#шаг-3-поднять-кластер-и-kubeconfig) и [шаг 4](#шаг-4-проверить-кластер) из основной инструкции.

---

## Дополнительно: скрипты в `scripts/`

**Windows** (из корня репозитория; при блокировке `.ps1` используйте `.cmd`):

| Команда | Зачем |
|---------|--------|
| `scripts\minikube-down.cmd` | Удалить кластер minikube (профиль `mock-exams`) |
| `scripts\clean-local-k8s.cmd` | Удалить кластер и очистить `output/` |
| `scripts\clean-local-k8s.cmd -Full` | То же + сброс кэша minikube в `%USERPROFILE%\.minikube` |
| `scripts\install-minikube.cmd -Reinstall` | Переустановить minikube и kubectl через winget |

**macOS** (после `chmod +x scripts/*.sh`):

| Команда | Зачем |
|---------|--------|
| `./scripts/minikube-down.sh` | Удалить профиль `mock-exams` |
| `./scripts/clean-local-k8s.sh` | Удалить кластеры и очистить `output/` |
| `./scripts/clean-local-k8s.sh --full` | То же + удалить `~/.minikube` |
| `./scripts/install-minikube.sh --reinstall` | Переустановить через `brew` |

---

## Заметки

- Каталог **`output/`** создаётся скриптом; в нём лежит **`kubeconfig.yaml`** для приложения (в git не коммитится).
- **`docker compose`** ожидает, что minikube уже запущен на хосте и `output/kubeconfig.yaml` актуален.
- На **macOS** и **Windows** с Docker Desktop имя **`host.docker.internal`** для доступа к API на хосте из контейнера обычно работает (см. код приложения).
- На **Linux** без Docker Desktop иногда нет `host.docker.internal`; при проблемах с доступом к API из контейнера может понадобиться переменная **`K8S_API_ENDPOINT`** в `docker-compose` — смотрите документацию minikube для вашего драйвера.
