# 07. Values, overlays, and secrets hygiene

## Precedence (highest last)

1. `values.yaml` inside the chart  
2. Parent chart values (for subcharts)  
3. `-f values-a.yaml` (later files win over earlier)  
4. `--set` / `--set-string` / `--set-file`

```bash
helm upgrade --install shop ./webshop \
  -f values.yaml \
  -f values-prod.yaml \
  --set image.tag=1.2.3
```

## Layered files

Common layout in Git:

```text
charts/webshop/
  values.yaml           # safe defaults
deploy/
  webshop/
    values-dev.yaml
    values-stage.yaml
    values-prod.yaml
```

Keep **chart defaults** generic. Put environment-specific hosts, replica counts, and resource sizes in overlay files.

## Coalesce and empty values

- `--set image.tag=` can clear a value.
- Prefer explicit overlays over dozens of `--set` in CI (hard to review).

## Schema (optional but good)

`values.schema.json` lets Helm validate values on install/upgrade:

```bash
helm lint ./webshop
# fails if values violate the schema (when present)
```

Start small: require `image.repository` and `image.tag`.

## Secrets

**Do not** commit production secrets in `values-*.yaml`.

Options:

| Approach | Notes |
|----------|-------|
| External Secret Operator / Vault | best for clusters |
| Sealed Secrets / SOPS | encrypted in Git |
| `--set-file` from CI secret store | OK for pipelines |
| Helm `Secret` templates from values | only if values come from a secret manager at deploy time |

Charts may still *define* Secret manifests that read `.Values.auth.password` — the **source** of that value must be secure.

## `lookup` (use carefully)

```yaml
{{- $prev := lookup "v1" "Secret" .Release.Namespace "my-secret" }}
```

`lookup` reads live cluster state at render time. It breaks pure `helm template` in CI (no cluster) and makes charts harder to reason about. Prefer deterministic values.

## Checklist

- Value file layering order.
- Why `--set` soup is painful in PR review.
- Secret hygiene options.
- When `lookup` hurts.

Lab: [08-lab-env-values.md](08-lab-env-values.md).
