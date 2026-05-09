# Установка mock-exams

Локальный Kubernetes-кластер за одну команду через утилиту [`mockctl`](mockctl/README.md).

## Требования

- **Docker** запущен:
  - Windows / macOS — Docker Desktop.
  - Linux — `docker.io`/`docker-ce` (`sudo systemctl start docker`).
  - WSL — Docker Desktop с WSL Integration **или** docker внутри Ubuntu.
- ~5 ГБ свободного места и доступ в интернет (первый запуск качает образы Kubernetes).

## Windows (PowerShell)

```powershell
$mc="$env:USERPROFILE\mockctl.exe"
iwr https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-windows-amd64.exe -OutFile $mc -UseBasicParsing
& $mc install
& $mc up
& $mc status
```

Или одной строкой:

```powershell
$mc="$env:USERPROFILE\mockctl.exe"; iwr https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-windows-amd64.exe -OutFile $mc -UseBasicParsing; & $mc install; if ($LASTEXITCODE -eq 0) { & $mc up; & $mc status }
```

## Linux / WSL (bash)

```bash
mc=~/mockctl
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-linux-amd64 -o "$mc"
chmod +x "$mc"
"$mc" install
"$mc" up
"$mc" status
```

Или одной строкой:

```bash
mc=~/mockctl && curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-linux-amd64 -o "$mc" && chmod +x "$mc" && "$mc" install && "$mc" up && "$mc" status
```

Для arm64 замените `mockctl-linux-amd64` на `mockctl-linux-arm64`.

## macOS

Однострочник с авто-определением архитектуры (Apple Silicon или Intel):

```bash
mc=~/mockctl && arch=$(uname -m | sed 's/x86_64/amd64/') && curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-darwin-${arch} -o "$mc" && chmod +x "$mc" && "$mc" install && "$mc" up && "$mc" status
```

То же по шагам:

```bash
mc=~/mockctl
arch=$(uname -m | sed 's/x86_64/amd64/')   # arm64 (Apple Silicon) или amd64 (Intel)
curl -fsSL https://raw.githubusercontent.com/FedorArbuzov/mock-exams/master/mockctl/dist/mockctl-darwin-${arch} -o "$mc"
chmod +x "$mc"
"$mc" install
"$mc" up
"$mc" status
```

## Использование кластера

`mockctl up` создаёт `output/kubeconfig.yaml`. Дальше:

```bash
export KUBECONFIG="$PWD/output/kubeconfig.yaml"
kubectl get nodes
kubectl get pods -A
```

PowerShell-аналог:

```powershell
$env:KUBECONFIG = "$PWD\output\kubeconfig.yaml"
kubectl get nodes
```

## Жизненный цикл

```bash
mockctl up              # поднять (первый раз 3-5 мин, далее быстрее)
mockctl status          # ноды + поды
mockctl kubeconfig      # перевыгрузить kubeconfig, если порт сменился
mockctl down --soft     # остановить, сохранить состояние (повторный up ~30 сек)
mockctl down            # удалить кластер
mockctl clean --full    # полный сброс данных, бинарники остаются
mockctl uninstall --yes # снести всё, включая minikube/kubectl
```

## Если что-то пошло не так

| Симптом | Что делать |
|---|---|
| `docker is installed but the daemon is not responding` | Запустите Docker Desktop, или на Linux/WSL: `sudo service docker start` |
| `permission denied while trying to connect ... docker.sock` | `sudo usermod -aG docker "$USER"`, затем (для WSL из PowerShell) `wsl --shutdown` и заново открыть терминал |
| `winget : not recognized` (Windows) | Установите App Installer из Microsoft Store: <https://apps.microsoft.com/detail/9nblggh4nns1> |
| `connection refused` при `kubectl ...` | `mockctl kubeconfig` |
| Долго висит на `Verifying ingress addon...` | Подождите 1-2 минуты или используйте `mockctl up --no-addons` |

Подробности по командам и сборке: [`mockctl/README.md`](mockctl/README.md).
