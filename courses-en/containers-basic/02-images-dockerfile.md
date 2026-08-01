# 02. Image and Dockerfile: layers, COPY, CMD, build

## Intro: "works on my machine" in CI

A developer sends a zip with `pip install` on Windows, and the pipeline on Linux fails on `gcc`. DevOps adds a **Dockerfile**: a fixed `python:3.12-slim`, `requirements.txt`, a non-root `USER` — and the build in GitLab reproduces the local result. This chapter is about **how an image is built**, **layers** and the instructions you'll see in [`deploy/containers/stack`](../../deploy/containers/stack).

## What you'll learn

- The model of **layers** and the **cache** during `docker build`.
- The `FROM`, `WORKDIR`, `COPY`, `RUN`, `EXPOSE`, `USER`, `CMD` instructions.
- **Build context** and `.dockerignore`.
- **Multistage** — why and where to see an example.

## Image layers

Each Dockerfile instruction (except `ARG`, and `ENV` in some cases) creates a **new layer** — a read-only diff. When it starts, a container adds a **thin writable layer** on top.

```text
[base FROM python:3.12-slim]
  → RUN pip install …
  → COPY app.py
  → USER appuser
  → CMD ["python", "app.py"]
```

| Principle | Why |
|---------|--------|
| Rarely changing things **higher up** (earlier in the file) | caches `RUN pip install` when only `app.py` changes |
| A single `RUN` for apt | fewer layers and smaller size |
| `.dockerignore` | don't copy `.git`, venv, secrets |

Ignore example: [`examples/.dockerignore`](examples/.dockerignore).

## Dockerfile API (the essentials)

| Instruction | Purpose |
|------------|------------|
| `FROM` | base image (required) |
| `WORKDIR` | default directory |
| `COPY` / `ADD` | files from the **context** into the image (`COPY` is preferred) |
| `RUN` | a command **at build time** (installs packages) |
| `ENV` | variables in the image and for subsequent instructions |
| `EXPOSE` | port **documentation** (does not publish to the host automatically) |
| `USER` | which UID to run the process as |
| `CMD` | the **default** command on `docker run` |
| `ENTRYPOINT` | a fixed entry point; `CMD` provides the arguments |

**CMD vs ENTRYPOINT:** for the course's API stack, `CMD ["python", "app.py"]` is enough — as in [`stack/api/Dockerfile`](../../deploy/containers/stack/api/Dockerfile).

## Breakdown of the API image on the stand

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN useradd -m -u 10001 appuser
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
USER appuser
EXPOSE 8080
CMD ["python", "app.py"]
```

| Line | Meaning |
|--------|--------|
| `useradd` + `USER` | the process is not root (chapter [14](14-security.md)) |
| `COPY requirements` before `app.py` | caches pip when only the code changes |
| `EXPOSE 8080` | the Flask port inside the compose network |
| exec-form `CMD ["…"]` | PID 1 without a shell — correct signal handling |

The web image — `nginx:1.27-alpine` + `COPY nginx.conf` — is a minimal **reverse proxy** to `api:8080`.

## Build context

```bash
docker build -t myapi:lab ./stack/api
```

Only the `./stack/api` directory (and what's not in `.dockerignore`) ends up in the context. Secrets from the parent repository **must not** end up in the context.

```bash
docker build --no-cache -t myapi:lab ./stack/api
docker image history myapi:lab
```

**`docker image history`** — a list of layers and sizes; useful when "the image has bloated."

## Multistage build

Heavy build dependencies (compiler, dev packages) stay in the **builder** stage, and only the artifact is copied into runtime:

```dockerfile
COPY --from=builder /install /usr/local
```

Full example: [`examples/Dockerfile.multistage`](examples/Dockerfile.multistage). On the stand, the api is a **single-stage** slim image for lab simplicity.

## Tags and identification

| Tag | When |
|-----|--------|
| `:latest` | convenient locally; **dangerous** in prod without a pin |
| `:1.2.3` / git SHA | reproducible deploy |
| `registry/host/app:tag` | full name for push |

By default, Compose tags `project_service:latest` on `build:`.

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|-------------|
| `COPY ..` of a huge repo | build takes minutes, secrets in a layer | narrow context + `.dockerignore` |
| `RUN apt` every time out of order | cache miss | combine apt into a single `RUN` |
| `CMD` shell-form `CMD python app.py` | signals don't reach the app | exec-form `["python","app.py"]` |
| Root in a production image | container escape = root on the host* | `USER` (* with weakened seccomp) |
| `ADD` with a URL for no reason | unpredictability | `COPY` |

## In production

- **Pin** the base image by digest: `python:3.12-slim@sha256:…`.
- **Distroless** / minimal base after multistage.
- CI: `docker build` with `--pull` periodically for security patches.
- Image scanning (chapter [14](14-security.md)): Trivy, Grype, GitLab Container Scanning.
- Don't store **tokens** in `ARG`/`ENV` layers — they remain in the history.

## Interview notes

- A layer is immutable; a change = a new layer + a new image id.
- `.dockerignore` is the analog of `.gitignore` for the **build**, not for runtime.
- `EXPOSE` does not open a port on the host — you need `-p` or `ports:` in compose.
- Multistage reduces the **attack surface** and size.

## Summary

A Dockerfile describes the application's **layers**: base, dependencies, code, user, startup command. The order of instructions and `.dockerignore` determine **CI speed** and **security**. The course stand builds the api and web from `deploy/containers/stack` — in the lab you'll build your own tag manually.

## Checklist

- What ends up in the build context?
- Why copy `requirements.txt` before `app.py`?
- How does `CMD` differ from `RUN`?
- Where can you see the multistage example in the course?

Next lesson: [03. Lab: Dockerfile](03-lab-dockerfile.md).
