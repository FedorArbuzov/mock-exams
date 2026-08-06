# 05. Helpers, labels, and naming

## Why `_helpers.tpl`

Duplicated name and label snippets drift. Named templates in `_helpers.tpl` (files starting with `_` are not rendered as manifests) keep selectors consistent.

```yaml
{{/*
Expand the name of the chart.
*/}}
{{- define "webshop.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{- define "webshop.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name (include "webshop.name" .) | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
```

Call with `include` (returns a string you can pipe):

```yaml
metadata:
  name: {{ include "webshop.fullname" . }}
```

## Standard Kubernetes labels

Recommended labels (Helm scaffold already uses them):

| Label | Meaning |
|-------|---------|
| `app.kubernetes.io/name` | app name |
| `app.kubernetes.io/instance` | release name |
| `app.kubernetes.io/version` | app version |
| `app.kubernetes.io/managed-by` | usually `Helm` |
| `helm.sh/chart` | `chartName-version` |

**Selectors** on Services/Deployments must match **pod template labels**. If `fullname` changes between upgrades in a way that breaks selectors, upgrades fail.

## Name length

Kubernetes names ≤ 63 chars for many resources. Always `trunc 63 | trimSuffix "-"`.

## Common helper set

```yaml
{{- define "webshop.labels" -}}
helm.sh/chart: {{ include "webshop.chart" . }}
{{ include "webshop.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{- define "webshop.selectorLabels" -}}
app.kubernetes.io/name: {{ include "webshop.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}
```

Deployment:

```yaml
spec:
  selector:
    matchLabels:
      {{- include "webshop.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "webshop.selectorLabels" . | nindent 8 }}
```

Service selector: the **same** `selectorLabels` helper — never hand-copy.

## Anti-patterns

- Putting release-revision into selector labels (breaks upgrades).
- Random suffixes in Deployment names (Helm already tracks releases).
- Different label keys in Service vs Pod.

## Checklist

- Role of `_helpers.tpl` and `define` / `include`.
- Why selector labels must stay stable across upgrades.
- Why truncate names.

Lab: [06-lab-helpers.md](06-lab-helpers.md).
