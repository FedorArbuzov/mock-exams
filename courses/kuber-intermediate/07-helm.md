# 07. Helm: install, upgrade, values, шаблоны

## Зачем

Когда у вас одно приложение — `kubectl apply -f` достаточно. Когда у вас 20 манифестов на namespace, и они отличаются между `dev`/`stage`/`prod` только парой значений — копипаста YAML быстро превращается в ад.

**Helm** — пакетный менеджер для Kubernetes. Он:

- упаковывает группу манифестов в **chart** (как пакет в apt/npm);
- умеет шаблонизировать YAML по `values.yaml`;
- ведёт **историю релизов** (можно откатиться);
- разворачивает чужие чарты из реестров (Bitnami, Prometheus, Argo CD и сотни других).

## Установка `helm`

В `mockctl install` он не входит. Поставьте отдельно:

- macOS: `brew install helm`
- Linux: `curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`
- Windows: `winget install Helm.Helm`

Проверка: `helm version` → выдаст `v3.x.x`.

## Структура чарта

```text
mychart/
├── Chart.yaml          # метаданные чарта
├── values.yaml         # параметры по умолчанию
├── templates/          # шаблоны манифестов
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl    # переиспользуемые шаблоны
└── charts/             # вложенные чарты (зависимости)
```

`Chart.yaml`:

```yaml
apiVersion: v2
name: mychart
description: My first Helm chart
type: application
version: 0.1.0          # версия чарта
appVersion: "1.27"      # версия приложения внутри
```

## Шаблоны

`templates/deployment.yaml` — обычный YAML с подстановками:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-{{ .Chart.Name }}
  labels:
    app: {{ .Chart.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app: {{ .Chart.Name }}
  template:
    metadata:
      labels:
        app: {{ .Chart.Name }}
    spec:
      containers:
        - name: {{ .Chart.Name }}
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          ports:
            - containerPort: {{ .Values.service.port }}
```

`values.yaml`:

```yaml
replicaCount: 2
image:
  repository: nginx
  tag: 1.27-alpine
service:
  port: 80
```

## Что подставляется

- `{{ .Values.X }}` — из `values.yaml` (или флага `--set` / `-f file.yaml`).
- `{{ .Chart.Name }}`, `{{ .Chart.Version }}` — из `Chart.yaml`.
- `{{ .Release.Name }}`, `{{ .Release.Namespace }}` — из параметров `helm install`.
- `{{ .Files.Get "config.json" }}` — содержимое файла из чарта.

Условия и циклы:

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
...
{{- end }}

{{- range .Values.envVars }}
- name: {{ .name }}
  value: {{ .value | quote }}
{{- end }}
```

## Жизненный цикл релиза

`Release` — это конкретная установка чарта в кластер. Один чарт можно установить **много раз** под разными именами.

```bash
helm install my-app ./mychart
helm list
helm upgrade my-app ./mychart --set replicaCount=4
helm upgrade my-app ./mychart -f prod-values.yaml
helm history my-app
helm rollback my-app 1
helm uninstall my-app
```

Что хранится между релизами: история (Helm пишет её как Secret в namespace), **diff** между версиями.

## Reverse-engineering чужих чартов

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgresql
helm show values bitnami/postgresql > defaults.yaml
helm install pg bitnami/postgresql -f my-overrides.yaml
```

Для отладки: смотрите, какой YAML получится **до** apply:

```bash
helm template my-app ./mychart > out.yaml
helm install my-app ./mychart --dry-run --debug
```

## Полезные команды

```bash
helm create newchart        # сгенерировать заготовку
helm lint ./mychart         # проверка ошибок
helm template ./mychart     # отрендерить шаблоны без установки
helm install x ./mychart --wait    # ждать готовности подов
helm get values my-app             # какие values сейчас в релизе
helm get manifest my-app           # какой YAML был задеплоен
```

## Чек-лист

- В чём разница между `Chart.yaml`, `values.yaml` и `templates/`.
- Что произойдёт, если `helm install` запустить дважды с одним release-name.
- Чем `helm upgrade --install` удобнее, чем отдельно `install`/`upgrade`.
- Как «отрендерить» шаблоны и проверить YAML до apply.
- Где Helm хранит историю релизов?

В лабе [08-lab-helm.md](08-lab-helm.md) сделаем свой чарт и установим Postgres из Bitnami.
