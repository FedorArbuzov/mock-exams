# 04. Template language: actions, Sprig, scoping

Helm uses **Go templates** plus the **Sprig** function library.

## Whitespace control

```yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
...
{{- end }}
```

`-` next to `{{` / `}}` trims whitespace. Wrong whitespace → invalid YAML. Always `helm template` after edits.

## Conditionals and loops

```yaml
{{- if .Values.serviceAccount.create }}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "webshop.serviceAccountName" . }}
{{- end }}

env:
{{- range .Values.env }}
  - name: {{ .name | quote }}
    value: {{ .value | quote }}
{{- end }}
```

`with` rebinds `.`:

```yaml
{{- with .Values.image }}
image: "{{ .repository }}:{{ .tag }}"
{{- end }}
```

Inside `with` / `range`, the root context is available as `$`:

```yaml
{{- range .Values.env }}
- name: {{ .name }}
  value: {{ $.Release.Name }}-{{ .value }}
{{- end }}
```

## Common Sprig / Helm functions

| Function | Use |
|----------|-----|
| `default` | `{{ .Values.tag \| default .Chart.AppVersion }}` |
| `quote` / `squote` | safe strings in YAML |
| `toYaml` / `nindent` | dump maps into manifests |
| `required` | fail render if value missing |
| `include` | call a named template in `_helpers.tpl` |
| `tpl` | render a string as a template (powerful, easy to abuse) |
| `lower` / `trunc` / `trimSuffix` | name sanitizing |

Example:

```yaml
resources:
  {{- toYaml .Values.resources | nindent 12 }}
```

```yaml
image: "{{ .Values.image.repository }}:{{ required "image.tag is required" .Values.image.tag }}"
```

## `tpl` — use sparingly

```yaml
# values.yaml
config: |
  url: {{ .Values.publicUrl }}

# template
{{- tpl .Values.config . | nindent 4 }}
```

Useful for ConfigMaps that themselves need templating. Hard to debug — prefer structured values when possible.

## Capabilities

Gate APIs by cluster version:

```yaml
{{- if semverCompare ">=1.19-0" .Capabilities.KubeVersion.GitVersion }}
apiVersion: networking.k8s.io/v1
{{- else }}
apiVersion: networking.k8s.io/v1beta1
{{- end }}
kind: Ingress
```

On modern clusters you usually pin `networking.k8s.io/v1` and drop the branch.

## Failure modes

- Missing key → empty string (unless `required`).
- Wrong indent after `toYaml` → broken YAML.
- Using `.` after `with` when you meant `$`.

## Checklist

- `if` / `range` / `with` / `$`.
- `include` vs `template`.
- `toYaml | nindent`.
- When to use `required`.

Next: [05-helpers-and-labels.md](05-helpers-and-labels.md).
