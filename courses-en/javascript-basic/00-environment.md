# 00. Environment: Node.js, REPL, editor

## Intro: a scenario from work

Friday, 5:42 PM. A Slack message from DevOps: "CI is failing on the `node scripts/migrate-users.js` step — does it work for you locally?" You open your laptop, run the same file, and get `SyntaxError: Cannot use import statement outside a module`. You're on Node 22; the pipeline runs Node 16. A colleague on another team sends a screenshot: "I just get `node: command not found`." A third developer swears "the script prints nothing," even though you can see output in the terminal — turns out he's double-clicking the file in Windows Explorer, and the window closes instantly.

Three different symptoms, one root cause: **the environment isn't set up or pinned down**. In the [`linux-basic`](../linux-basic/README.md) course you learned to check `whoami`, the OS version, and binary paths. The JavaScript equivalent is `node --version`, the directory you run from, and `"type": "module"` in `package.json`. Without that foundation, every later lesson — types, closures, `fetch` to FastAPI on `:8090` — turns into a guessing game of "why doesn't this work for me."

In mock-exams, the backend track lives in Docker (`deploy/fastapi`, port **8090**), while **javascript-basic** deliberately starts **on the host**: one file, one terminal, no containers. That's exactly how you'll write migration utilities, pre-commit hooks, and one-off CI scripts before you get to [`nodejs-basic`](../javascript-path.md) and a full BFF.

## What you'll learn

- Why **Node.js**, not a browser with HTML, is the better tool for learning JavaScript in the first weeks.
- How to install **Node.js LTS**, check the version, and avoid the "old Node in CI" trap.
- The development loop: **file → `node script.js` → read the output → fix**.
- What the **REPL** is, when it helps, and when it hurts.
- The **`examples/`** directory layout, `"type": "module"`, and **Node vs. browser** differences.
- Minimal **editor** setup (ESLint, Prettier) without overloading it.

## Why Node in a "basic JavaScript" course

JavaScript was born in the **browser** — that's where it drives the DOM, reacts to clicks, and talks to APIs. But the **language** and the **runtime** are two different things. **Node.js** is a runtime built on the **V8** engine (the same one Chrome uses) that executes JavaScript **outside the browser**: in a terminal, in CI, on a server.

For learning, Node gives you three practical advantages:

1. **The shortest feedback loop.** Create `hello.js`, type `node hello.js`, see the result. No HTML, no bundler, no dev server, no CORS to untangle before you even know what `const` is.
2. **The same syntax carries forward.** Code from lesson 02 (`let`, `const`) and lesson 29 (`fetch`) reads the same in the browser and in Node 18+ (where `fetch` is built in).
3. **A tie to the mock-exams ecosystem.** Later, [`nodejs-basic`](../javascript-path.md) will stand up a BFF that proxies requests to FastAPI on `:8090`; [`react-basic`](../javascript-path.md) will render a UI for the same shop domain. Right now you're building the habit of running `.js` files as confidently as you run `bash script.sh` in [`linux-basic`](../linux-basic/README.md).

The browser and **DevTools** come back in the debugging lesson ([36-debugging.md](36-debugging.md)) and the HTTP lesson ([29-fetch.md](29-fetch.md)). For now: terminal and editor.

## Installing Node.js LTS

**LTS** (Long Term Support) is the branch with predictable security updates. As of this writing, **20.x** or **22.x** is recommended. The course minimum is **Node 18+** (native `fetch`, stable ES modules).

### Linux and macOS (nvm)

The **nvm** version manager lets you keep several Node versions and switch per project — the equivalent of `pyenv` in the Python track:

```bash
# Install nvm — see https://github.com/nvm-sh/nvm
nvm install --lts
nvm use --lts

node --version    # v22.x.x or v20.x.x
npm --version     # package manager, bundled with Node
```

### Windows

Use the installer from [nodejs.org](https://nodejs.org/) or **nvm-windows**. After installing, **restart your terminal** — PATH only updates in new sessions.

### Checking you match CI

Add an `.nvmrc` file or an `"engines"` field in `package.json` at the root of your pet projects:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

That way "works on my machine" won't diverge from the GitLab pipeline in [`gitlab-basic`](../gitlab-basic/README.md).

| Tool | Purpose | When you'll need it |
|------------|------------|-------------------|
| `node` | Run `.js` files and the REPL | every lesson |
| `npm` | Install packages | `nodejs-basic`, `react-basic` |
| `npx` | Run a CLI once without a global install | ESLint, Vitest |

## First run: a file and its output

Create a file called `hello.js` anywhere:

```javascript
// hello.js — your first executable script in this course
console.log("Hello, JavaScript!");
console.log("Node version:", process.version);
console.log("Platform:", process.platform);
```

Run it:

```bash
node hello.js
```

**What you'll see:**

```text
Hello, JavaScript!
Node version: v22.11.0
Platform: win32
```

`console.log` is your main diagnostic tool for the first few weeks. It writes to **stdout** (standard output), the same stream that shell command output goes to. In production, Node projects more often use structured logging (**pino**, **winston**) with `info`/`error` levels and JSON formatting for ELK — that's a topic for [`nodejs-basic`](../javascript-path.md) and [`observability-basic`](../observability-basic/README.md).

The **`process`** object is the bridge between your script and the operating system: Node version, platform, environment variables (`process.env.PORT`), exit code (`process.exit(1)`). Deploy scripts in mock-exams often start by checking `process.version` so they don't migrate data on Node 16.

### The classic first-day mistake

```bash
node hello     # missing the .js extension
```

In older Node versions, this made Node look for a `hello` module in `node_modules`. **Always** specify `hello.js` or the full path. In CI you'll see it written out explicitly: `node scripts/hello.js`.

## REPL — the interactive console

The **REPL** (Read-Eval-Print Loop) is a mode where Node reads a line, evaluates the expression, and prints the result:

```bash
node
```

```javascript
> 2 + 2
4
> typeof "hello"
'string'
> const x = [1, 2, 3]
undefined          // assignment doesn't return a value in the REPL
> x.map(n => n * 2)
[ 2, 4, 6 ]
> 0.1 + 0.2
0.30000000000000004
```

To exit: `.exit`, Ctrl+D (on Windows in PowerShell, Ctrl+D sometimes needs pressing twice — `.exit` is more reliable).

The REPL is great for **experimenting**: types, one-liners, "what does `typeof null` return?" For lab work, use **separate files** in `examples/lab/` — you can version them, run them in CI, and share them with a colleague. Don't copy 200 lines of a lab out of your REPL history — you won't be able to reproduce it a week later.

## Course directory layout

```text
courses/javascript-basic/
├── README.md
├── 00-environment.md … 39-capstone.md
├── interview-cheatsheet.md
└── examples/
    ├── package.json      # "type": "module"
    ├── lab/              # your lab solutions
    └── solutions/        # reference answers — only after your own attempt
```

Move into the examples directory and confirm the path matches:

```bash
cd courses/javascript-basic/examples
node --version
ls lab/          # Linux/macOS
dir lab\         # Windows PowerShell
```

If the repo is cloned to `C:\Users\you\mock-exams`, the full path to the labs is `mock-exams/courses/javascript-basic/examples/lab/`. Always run from `examples/` — otherwise relative paths like `lab/data/products.json` (lesson 09) won't be found.

## Editor and extensions

**VS Code**, **Cursor**, WebStorm, Neovim — anything with JS syntax highlighting works. For this course, you need:

| Extension / setting | Why |
|------------------------|-------|
| ESLint | catches errors before you even run `node` |
| Prettier | consistent formatting across the team |
| Format on save | fewer "spaces vs. tabs" diffs |

Don't spend your first week on themes and fonts. Spend it on the loop of **write → run → read the error**. `SyntaxError: Unexpected token` on line 14 is normal learning material, not a reason to reinstall your IDE.

### Encoding on Windows

Save files as **UTF-8**. If your comments use Cyrillic and the terminal shows garbled characters, check the terminal's encoding (`chcp 65001` in cmd) or use Windows Terminal. Paths containing Cyrillic characters sometimes break older tools — for learning projects, ASCII paths are safer.

## `package.json` and ES modules

In [`examples/package.json`](examples/package.json):

```json
{
  "name": "javascript-basic-labs",
  "type": "module",
  "private": true
}
```

The **`"type": "module"`** field tells Node: files with the `.js` extension are **ES modules**. That lets you write:

```javascript
import { readFileSync } from "node:fs";
export function helper() {}
```

Without this setting (or without the `.mjs` extension), `import` in a `.js` file throws the error you saw in the opening scenario.

**Don't mix** `require()` (CommonJS) and `import` (ESM) in the same project without understanding the boundary — details in [30-es-modules.md](30-es-modules.md). Course rule: use only **`import` / `export`**.

The **`node:`** prefix in `node:fs` explicitly marks a built-in Node module (recommended since Node 16+). It's how you tell `node:fs` apart from an npm package with a similar name.

## Node vs. the browser: what's shared and what's not

The same snippet:

```javascript
const sum = (a, b) => a + b;
console.log(sum(2, 3));
```

works in both Node and the browser's DevTools console. But the **global APIs** differ:

| Capability | Browser | Node.js |
|-------------|---------|---------|
| `document`, DOM | yes | no |
| `window` | yes | no (`globalThis`) |
| `fetch` | yes | yes (Node 18+) |
| `fs`, `path`, `process` | no | yes (`node:fs`, …) |
| CORS | restricts requests | doesn't apply |

In this course, roughly **90%** of the learning code carries over between environments unchanged. We flag differences explicitly: "Node only" or "browser only." Later, in [`react-basic`](../javascript-path.md), when you call `fetch('http://localhost:8090/api/v1/items')`, the backend handles CORS ([`fastapi/23-middleware-cors`](../fastapi/23-middleware-cors.md)); in a Node script, CORS doesn't get in the way.

```javascript
// Works in Node 18+ and in the browser
const url = "http://localhost:8090/health";
// const res = await fetch(url);  // await comes later, lesson 27
```

## How this connects to the course

| Related material | Connection |
|-------------------|-------|
| [01. The landscape](01-landscape.md) | ECMAScript, engines, where your `node hello.js` actually runs |
| [03. Lab: first scripts](03-lab-first-scripts.md) | reinforces the file → node → output loop |
| [30. ES modules](30-es-modules.md) | deeper dive into `"type": "module"`, importing JSON |
| [`linux-basic` 02–03](../linux-basic/02-shell-redirection.md) | terminal, paths, stdout redirection |
| [`fastapi` deploy :8090](../../deploy/fastapi/README.md) | the target for `fetch` later in the course |

## Common mistakes

**"Node not found" after installing.** The terminal wasn't restarted; Node isn't on PATH; it was installed via snap without classic mode. Check with `which node` (Linux/macOS) or `Get-Command node` (PowerShell).

**The script "does nothing" or the window flashes.** Double-clicking on Windows closes the console right after `console.log` runs. Run from a terminal instead, or add `readline` / a pause only for debugging — that won't be present in CI.

**`import` without `"type": "module"`.** Either add the field to `package.json`, or rename the file to `.mjs`. Don't add `"use strict"` hoping it will "fix" import — those are unrelated mechanisms.

**Different Node versions across the team.** Pin the LTS version in the README and CI; use `engines` or `.nvmrc`. Node 16 is EOL — not a target version for this course.

**Running from the wrong directory.** `node lab/09-load.js` looks for `lab/data/products.json` relative to the **current working directory**, not relative to the script file. Make `cd examples` before running a mandatory habit.

## Summary

The javascript-basic environment is **Node.js LTS on the host**, a terminal, and an editor. You run `.js` files with `node path/to/file.js`, experiment in the REPL, and work inside the `examples/` directory with ES modules. `console.log` and `process.version` are your first diagnostic tools; types, modules, and HTTP calls to the shop API on `:8090` come later. Spend an hour getting the install right and you'll save days of "I can't reproduce this."

## Checklist

- [ ] `node --version` shows **20.x or 22.x** (18 minimum)
- [ ] `npm --version` responds without error
- [ ] A `hello.js` file with `console.log` runs and prints a line
- [ ] REPL: `typeof 42` → `'number'`
- [ ] You've opened `courses/javascript-basic/examples/` and can see `package.json` with `"type": "module"`
- [ ] You understand why labs run from `examples/`, not the repo root
- [ ] You can explain to a colleague the difference between "Node isn't installed" and "Node 16 vs. 22"

Next lesson: [01. The JavaScript landscape](01-landscape.md).
