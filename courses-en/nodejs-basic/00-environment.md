# 00. Environment: npm, Node project structure

## Introduction: a scenario from work

Monday, onboarding day. The tech lead walks you through the repo: "The BFF lives in `courses/nodejs-basic/examples`, it comes up with `npm run dev`, and it proxies the shop API to FastAPI on `:8090`." You clone mock-exams, `cd` into the directory, and run `node src/index.js` — and get `Error: Cannot find module 'express'`. A colleague from the Python track asks, "Why not `pip install`?" DevOps complains in CI: "The `npm ci` step is failing — there's no `package-lock.json`." A third developer runs the lab from the repo root and hits `ENOENT: no such file or directory` — because the relative path `lab/01-argv.js` is being looked up from the wrong place.

In [`javascript-basic`](../javascript-basic/00-environment.md) you already installed Node LTS and ran standalone `.js` files from `javascript-basic/examples/` **without any npm packages**. **nodejs-basic** is the next step: a full-fledged **Node project** with a `package.json`, dependencies, npm scripts, and an `examples/` directory that will gradually turn into an Express BFF. Without this foundation, the labs on the event loop, HTTP, and proxying to [`deploy/fastapi`](../../deploy/fastapi/README.md) collapse into "module not found" and "works on my machine" chaos.

## What you'll learn

- How **nodejs-basic/examples** differs from **javascript-basic/examples** (dependencies, scripts, the BFF).
- How **`package.json`** and **`package-lock.json`** work, and why you need `npm install` / `npm ci`.
- How to read and write **npm scripts** (`dev`, `start`, `lab:*`).
- Why you pin **Node.js LTS** and the `"engines"` field.
- The course's directory structure: `lab/`, `src/`, `solutions/`.
- The minimal working cycle: `cd examples` → `npm install` → `node lab/…` or `npm run dev`.

---

## From javascript-basic to nodejs-basic

| Aspect | javascript-basic | nodejs-basic |
|--------|------------------|--------------|
| Dependencies | only Node's built-in modules | Express, pino, dotenv, and others |
| Running | `node lab/file.js` | same, plus `npm run dev` for the server |
| Goal | the JS language, async, fetch | the Node runtime, BFF, HTTP, libuv |
| Shop API | optional, at the very end of the course | FastAPI `:8090` from chapter 20 on |
| Structure | `examples/lab/` | `examples/lab/` + `examples/src/` |

You're **not** re-covering `let`/`const` syntax, Promises, or `async`/`await` here — that's [`javascript-basic`](../javascript-basic/README.md). This course assumes you've already been through lessons 24–30 there (event loop overview, Promises, modules). If not, read [24-event-loop.md](../javascript-basic/24-event-loop.md) and [30-es-modules.md](../javascript-basic/30-es-modules.md) alongside this one.

---

## Node.js LTS and the course version

**LTS** (Long Term Support) is a Node release line with long-term security patch support. As of this course, the target versions are **20.x** or **22.x**. The minimum is **Node 18+** (native `fetch`, stable ES modules).

```bash
node --version    # v22.x.x or v20.x.x
npm --version     # 10.x — ships bundled with Node
```

Pin the version in the project so CI and your teammates don't drift from you:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

An `.nvmrc` file with a single line, `20` or `22`, is a habit carried over from [`gitlab-basic`](../gitlab-basic/README.md): the pipeline reads the same version as your local machine.

---

## npm: Node's package manager

**npm** (Node Package Manager) installs libraries from [registry.npmjs.org](https://www.npmjs.org/) into a local `node_modules/` directory. It's the equivalent of **`pip`** in the mock-exams Python track, or **`poetry add`** — except the npm ecosystem has historically been "flat": thousands of small packages, and a lockfile is mandatory.

| Command | Purpose |
|---------|------------|
| `npm install` | install dependencies from `package.json`; update the lockfile if needed |
| `npm ci` | a "clean" install strictly from `package-lock.json` — the CI standard |
| `npm install express` | add a dependency and record it in `package.json` |
| `npm run dev` | run a script from the `"scripts"` field |
| `npx eslint .` | run a CLI tool once without installing it globally |

**Don't commit** `node_modules/` — it's huge and gets rebuilt from the lockfile. It's already excluded in the mock-exams repo's `.gitignore`.

### package.json and package-lock.json

`package.json` is the project manifest: name, version, dependencies, scripts:

```json
{
  "name": "nodejs-basic-examples",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "lab:argv": "node lab/01-argv.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "dotenv": "^16.4.0",
    "pino": "^9.0.0"
  }
}
```

- **`"type": "module"`** — ES modules (`import`/`export`), same as in javascript-basic.
- **`dependencies`** — needed at runtime (Express for the BFF).
- **`devDependencies`** — dev-only (nodemon, eslint) — these show up later in [`javascript-testing`](../javascript-path.md).
- **`^4.21.0`** — semver: npm can install patch and minor updates within the same major version.

`package-lock.json` pins the **exact** versions of the entire dependency tree. Without it, "works on my machine" means Node 22 with express 4.21.1, while CI has express 4.19.0 and a different bug.

---

## First run of examples/

```bash
cd courses/nodejs-basic/examples
npm install
node --version
npm run lab:argv    # if the script has been added; otherwise node lab/01-argv.js for now
```

After `npm install`, a `node_modules/` directory appears — it holds Express and its transitive dependencies. Importing it in code:

```javascript
import express from "express";
// Node looks for "express" in node_modules/express
```

Built-in modules are imported with the **`node:`** prefix (the recommended convention since Node 16+):

```javascript
import { readFile } from "node:fs/promises";
import { argv, env } from "node:process";
```

---

## The nodejs-basic directory layout

```text
courses/nodejs-basic/
├── README.md
├── 00-environment.md … 39-capstone.md
├── interview-cheatsheet.md
└── examples/
    ├── package.json
    ├── package-lock.json
    ├── .env.example          # template — copy it to .env locally
    ├── lab/                  # phase 1-2 labs: CLI, event loop, fs
    ├── src/                  # Express BFF — from lab 23+
    │   └── index.js
    └── solutions/            # reference solutions — check after your own attempt
```

**Course rule:** run `node lab/…` and `npm run …` commands from **`examples/`**, not from the `mock-exams` root. Relative paths in the labs (`./data/config.json`, `../.env`) are anchored to the shell's current working directory — the same trap as in [javascript-basic/00-environment.md](../javascript-basic/00-environment.md).

---

## npm scripts: why not just `node file.js`

Scripts are a **contract** for the team and for CI:

```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js"
}
```

| Benefit | Example |
|--------------|--------|
| One command for everyone | `npm run dev` instead of "remember the flags" |
| Environment variables | `"dev": "NODE_ENV=development node src/index.js"` (on Windows — cross-env) |
| Chains | `"test": "vitest run && node lab/smoke.js"` |
| CI | `npm ci && npm run start` |

The **`--watch`** flag (Node 20+) restarts the process when files change — an alternative to nodemon for the early labs. The course's `examples/package.json` uses **nodemon** for convenience.

---

## Connection to the FastAPI stand on :8090

For now, the Express server in `src/` is just a stub; a full proxy to the shop API shows up in chapters 20 and 34. The [`deploy/fastapi`](../../deploy/fastapi/README.md) stand on port **8090** is brought up separately (Docker or locally):

```bash
# from deploy/fastapi — see the stand's README
curl http://localhost:8090/health
```

nodejs-basic teaches the **Node layer** between React (`react-basic`, port ~5173) and the Python API. REST contracts are covered in [`api-design`](../api-design/README.md). Client-side TypeScript types come later, in [`typescript-basic`](../typescript-basic/README.md).

---

## The difference from "just Node on a host"

javascript-basic deliberately runs **without** Docker and without extra packages — one V8, one terminal. nodejs-basic adds:

1. **Dependencies** — an HTTP framework, a logger, dotenv.
2. **A long-lived process** — a server listening on a port, handling signals ([02-process.md](02-process.md)).
3. **The event loop in depth** — libuv, not just the browser model ([04-event-loop-libuv.md](04-event-loop-libuv.md)).
4. **Integration** with the Python backend — the BFF pattern ([32-bff-pattern.md](32-bff-pattern.md)).

---

## Common mistakes

**Forgetting `npm install` after cloning.** Symptom: `Cannot find module 'express'`. Fix: `cd examples && npm install`.

**Running commands outside `examples/`.** Symptom: `ENOENT` for `lab/01-argv.js`. Fix: `cd courses/nodejs-basic/examples` before running `node`.

**Committing `node_modules`.** Bloats the repo; makes review impossible. Only `package.json` plus the lockfile belong in git.

**Node 16 in CI when `"engines": ">=20"`.** Fails on `fetch`, `--watch`, and other new APIs. Update the pipeline's image.

**Mixing CommonJS and ESM.** `require()` in a project with `"type": "module"` — an error. This course sticks to **`import`/`export`** ([09-modules-cjs-esm.md](09-modules-cjs-esm.md)).

**Secrets in `package.json`.** API keys don't belong in scripts or in the repo — only in a local `.env`, with `.env.example` committed to git ([28-env-config.md](28-env-config.md)).

---

## Summary

The nodejs-basic environment is **Node LTS**, an **`examples/`** directory, **`npm install`**, and a **`package.json`** with `"type": "module"` and npm scripts. The lockfile pins versions for CI. The `lab/` + `src/` structure sets you up for an Express BFF proxying to FastAPI `:8090`. From javascript-basic you carry over the habit of running `.js` files from the right directory; here you add the npm ecosystem and a server runtime.

## Checklist

- [ ] `node --version` — **20.x or 22.x**
- [ ] Ran `cd courses/nodejs-basic/examples` and `npm install` with no errors
- [ ] Understand the difference between `npm install` and `npm ci`
- [ ] See `node_modules/` and have no intention of committing it
- [ ] Know where `lab/`, `src/`, and `solutions/` are
- [ ] Can explain how nodejs-basic/examples is broader than javascript-basic/examples
- [ ] Know the port for the mock-exams FastAPI stand (**8090**)

Next lesson: [01. The Node.js and BFF landscape](01-landscape.md).
