# 01. CI YAML and runners

## Real-world scenario

Jobs stuck in **pending**. The YAML is fine — there is no runner with tag `docker`. GitLab **plans** pipelines; a **runner** executes them.

## Pipeline = stages + jobs

```yaml
stages:
  - test
  - build

lint:
  stage: test
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install ruff
    - ruff check app tests

unit:
  stage: test
  image: python:3.12-slim
  tags: [docker]
  script:
    - pip install -r requirements-dev.txt
    - pytest -q
```

- **`stages`** — ordered phases. Jobs in the same stage run in parallel (by default).  
- **`image`** — container for the job (Docker executor).  
- **`tags`** — which runner may pick the job.  
- **`script`** — commands; non-zero exit → failed job.

## Runner types (enough for this course)

| Executor | What it does | Course use |
|---|---|---|
| `docker` | Runs each job in a fresh container | **default** (`mock-gitlab-runner`) |
| `shell` | Runs on the runner host | avoid for labs |
| `kubernetes` | Job = Pod | [`gitlab-advanced`](../gitlab-advanced/README.md) |

Registration binds the runner to an instance/group/project token. Without a matching **online** runner + tags → **pending**.

## Common failures

| Symptom | Cause |
|---|---|
| pending forever | wrong `tags`, runner offline |
| `image pull failed` | no network / typo in image |
| YAML invalid | indentation; use CI Lint in GitLab UI |

## Checklist

- [ ] You can explain planner vs runner  
- [ ] You know why `tags: [docker]` matters on this stand  
- [ ] You know where to open **CI Lint**

## Next

[02 — Lab: first pipeline](02-lab-first-pipeline.md)
