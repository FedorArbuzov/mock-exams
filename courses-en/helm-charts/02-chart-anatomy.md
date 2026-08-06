# 02. Chart anatomy and releases

## Directory layout

```text
mychart/
├── Chart.yaml           # metadata (required)
├── values.yaml          # default values
├── values.schema.json   # optional JSON Schema for values
├── templates/           # Kubernetes manifests as Go templates
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── NOTES.txt        # printed after install
│   ├── _helpers.tpl     # partials (filename starts with _)
│   └── tests/           # helm test manifests
├── charts/              # vendored subcharts (or empty)
└── .helmignore          # like .gitignore for packaging
```

Generate a scaffold anytime:

```bash
helm create demo
```

## Chart.yaml

```yaml
apiVersion: v2
name: demo
description: Demo web app
type: application          # or library
version: 0.1.0             # chart version (SemVer) — bump when the chart changes
appVersion: "1.27.0"       # version of the app image / upstream (informational)
keywords: [demo, nginx]
maintainers:
  - name: platform
```

- **`version`** — what Helm uses for packaging and dependency resolution.
- **`appVersion`** — documentation; templates may reference `.Chart.AppVersion` for image tags.

## values.yaml

Defaults for `.Values.*`. Keep them **safe for local/dev**. Override for prod with `-f` files, never by editing the chart in place.

## templates/

Ordinary YAML plus Go template actions. Helm walks all files except those starting with `_` (partials) and `NOTES.txt` (special).

Built-in objects you will use constantly:

| Object | Examples |
|--------|----------|
| `.Values` | `.Values.replicaCount`, `.Values.image.tag` |
| `.Chart` | `.Chart.Name`, `.Chart.Version`, `.Chart.AppVersion` |
| `.Release` | `.Release.Name`, `.Release.Namespace`, `.Release.Service` |
| `.Capabilities` | `.Capabilities.KubeVersion.Version` |
| `.Files` | `.Files.Get "config/app.json"` |
| `.Template` | `.Template.Name` |

## What a release is

```bash
helm install shop ./demo -n shop --create-namespace
```

- **Release name:** `shop`
- **Chart:** `./demo` at some version
- **Namespace:** `shop`
- Helm stores revision metadata (Secrets named `sh.helm.release.v1.shop.v1`, …)

Same chart, two releases:

```bash
helm install shop-a ./demo -n a --create-namespace
helm install shop-b ./demo -n b --create-namespace
```

## Lifecycle commands

```bash
helm list -A
helm status shop -n shop
helm upgrade shop ./demo -n shop -f values-prod.yaml
helm upgrade --install shop ./demo -n shop -f values-prod.yaml   # idempotent
helm history shop -n shop
helm rollback shop 1 -n shop
helm uninstall shop -n shop
```

## Debug before apply

```bash
helm lint ./demo
helm template shop ./demo -f values-prod.yaml > /tmp/out.yaml
helm install shop ./demo -n shop --dry-run --debug
```

## Checklist

- Required files in a chart.
- Difference between chart `version` and `appVersion`.
- What is stored for a release and where.
- Why `helm upgrade --install` is the usual CI command.

Lab: [03-lab-first-chart.md](03-lab-first-chart.md).
