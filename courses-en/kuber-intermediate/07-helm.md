# 07. Helm: install, upgrade, values, templates

## Why

When you have a single application, `kubectl apply -f` is enough. When you have 20 manifests per namespace, and they differ between `dev`/`stage`/`prod` by only a couple of values, copy-pasting YAML quickly turns into hell.

**Helm** is a package manager for Kubernetes. It:

- packages a group of manifests into a **chart** (like a package in apt/npm);
- can templatize YAML using `values.yaml`;
- keeps a **release history** (you can roll back);
- deploys third-party charts from registries (Bitnami, Prometheus, Argo CD, and hundreds of others).

## Installing `helm`

It's not included in `mockctl install`. Install it separately:

- macOS: `brew install helm`
- Linux: `curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash`
- Windows: `winget install Helm.Helm`

Check: `helm version` → prints `v3.x.x`.

## Chart structure

```text
mychart/
├── Chart.yaml          # chart metadata
├── values.yaml         # default parameters
├── templates/          # manifest templates
│   ├── deployment.yaml
│   ├── service.yaml
│   └── _helpers.tpl    # reusable templates
└── charts/             # subcharts (dependencies)
```

`Chart.yaml`:

```yaml
apiVersion: v2
name: mychart
description: My first Helm chart
type: application
version: 0.1.0          # chart version
appVersion: "1.27"      # version of the application inside
```

## Templates

`templates/deployment.yaml` — ordinary YAML with substitutions:

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

## What gets substituted

- `{{ .Values.X }}` — from `values.yaml` (or the `--set` / `-f file.yaml` flag).
- `{{ .Chart.Name }}`, `{{ .Chart.Version }}` — from `Chart.yaml`.
- `{{ .Release.Name }}`, `{{ .Release.Namespace }}` — from the `helm install` parameters.
- `{{ .Files.Get "config.json" }}` — the contents of a file from the chart.

Conditionals and loops:

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

## Release lifecycle

A `Release` is a specific installation of a chart into a cluster. One chart can be installed **many times** under different names.

```bash
helm install my-app ./mychart
helm list
helm upgrade my-app ./mychart --set replicaCount=4
helm upgrade my-app ./mychart -f prod-values.yaml
helm history my-app
helm rollback my-app 1
helm uninstall my-app
```

What's stored between releases: the history (Helm writes it as a Secret in the namespace), and the **diff** between versions.

## Reverse-engineering third-party charts

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo update
helm search repo postgresql
helm show values bitnami/postgresql > defaults.yaml
helm install pg bitnami/postgresql -f my-overrides.yaml
```

For debugging: see what YAML you'll get **before** apply:

```bash
helm template my-app ./mychart > out.yaml
helm install my-app ./mychart --dry-run --debug
```

## Useful commands

```bash
helm create newchart        # generate a scaffold
helm lint ./mychart         # check for errors
helm template ./mychart     # render templates without installing
helm install x ./mychart --wait    # wait for pods to be ready
helm get values my-app             # which values are in the release now
helm get manifest my-app           # what YAML was deployed
```

## Checklist

- The difference between `Chart.yaml`, `values.yaml`, and `templates/`.
- What happens if you run `helm install` twice with the same release name.
- How `helm upgrade --install` is more convenient than separate `install`/`upgrade`.
- How to "render" templates and check the YAML before apply.
- Where Helm stores the release history?

In the lab [08-lab-helm.md](08-lab-helm.md) we'll build our own chart and install Postgres from Bitnami.
