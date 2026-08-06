# 09. Chart dependencies and umbrella charts

## Why dependencies

Your app chart often needs Postgres, Redis, or a shared library chart. Instead of vendoring hundreds of YAML lines, declare a dependency.

`Chart.yaml`:

```yaml
dependencies:
  - name: postgresql
    version: 15.5.32
    repository: https://charts.bitnami.com/bitnami
    condition: postgresql.enabled
    alias: db
```

Then:

```bash
helm dependency update ./shop   # downloads into charts/ and writes Chart.lock
helm dependency build ./shop    # rebuild from Chart.lock
```

## Subchart values

Values for a subchart live under the **chart name** (or **alias**) key:

```yaml
# values.yaml of parent
postgresql:
  enabled: true
  auth:
    password: "changeme"
  primary:
    persistence:
      enabled: false   # fine for local labs
```

With `alias: db` you would use top-level key `db:` instead of `postgresql:`.

## Conditions and tags

- `condition: postgresql.enabled` — parent can disable the subchart.
- `tags:` — enable groups of deps (less common in small charts).

## Library charts

`type: library` charts ship only `_helpers.tpl` / partials — no workloads. Parent charts `include` their defines. Good for company-wide naming conventions.

## Umbrella charts

One parent chart depending on `frontend`, `api`, `worker` subcharts. Convenient for demos; in large orgs often replaced by **separate releases per service** + GitOps app-of-apps (clear ownership, independent versions).

## Gotchas

- Pin **exact** dependency versions in production; re-run `dependency update` deliberately.
- Subchart upgrades can change CRDs or default passwords — read changelogs.
- Global values: some charts read `.Values.global.*` — document if you rely on them.

## Checklist

- `dependencies` vs `charts/` vs `Chart.lock`.
- How to pass values into a subchart.
- `condition` for optional deps.
- Umbrella vs many releases.

Lab: [10-lab-dependency.md](10-lab-dependency.md).
