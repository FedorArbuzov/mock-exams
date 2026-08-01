# 02. The `process` object: argv, env, exit codes, signals

## Intro: a scenario from work

A nightly deploy. Cron runs `node scripts/sync-inventory.js --dry-run`, but the script silently exits with code **1** — monitoring fires an alert. In the CI logs: "`DATABASE_URL` is undefined" — the variable exists in `.env` locally, but was not passed into the GitLab job. A developer hits Ctrl+C in the terminal where a migration is running — the process is aborted in the middle of a transaction. Another incident: an unhandled exception in an async callback "killed" the entire BFF, because there was no `uncaughtException` handler and PM2 restarted the instance.

The **`process`** object is the bridge between JavaScript and the operating system. In [`javascript-basic/00-environment`](../javascript-basic/00-environment.md) you already saw `process.version` and `process.platform`. In nodejs-basic it becomes a **production tool**: CLI arguments, secrets from env, exit codes for the shell, graceful shutdown on SIGTERM from Kubernetes.

## What you'll learn

- **`process.argv`** — how to read command-line arguments.
- **`process.env`** — configuration without hardcoding; the link to `.env` and FastAPI settings.
- **`process.exit(code)`** — the contract with the shell and CI.
- **SIGINT / SIGTERM** — clean shutdown of servers and scripts.
- **`uncaughtException` / `unhandledRejection`** — an overview, without abusing them.
- Practices for CLI labs and the future BFF.

---

## process.argv: command-line arguments

When you write:

```bash
node lab/check-env.js --port 3096 --verbose
```

Node passes an array of strings:

```javascript
// lab/check-env.js
console.log(process.argv);

// Example output:
// [
//   'C:\\Program Files\\nodejs\\node.exe',  // or /usr/bin/node
//   'C:\\...\\lab\\check-env.js',
//   '--port',
//   '3096',
//   '--verbose'
// ]
```

| Index | Contents |
|--------|------------|
| `0` | path to the `node` executable |
| `1` | path to the `.js` file being run |
| `2+` | user arguments |

Manual parsing (lab [03-lab-cli.md](03-lab-cli.md)):

```javascript
const args = process.argv.slice(2);

function getFlag(name) {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  return args[i + 1];
}

const port = getFlag("--port") ?? "3096";
const verbose = args.includes("--verbose");

if (verbose) {
  console.log(`Starting with port=${port}`);
}
```

For complex CLIs you'll later use **commander** or **yargs** — in basic, `slice(2)` and explicit checks are enough. The Python equivalent: `sys.argv` in [`linux-basic`](../linux-basic/README.md) scripts.

---

## process.env: environment configuration

**Environment variables** are a way to pass settings without changing code:

```javascript
const apiBase = process.env.SHOP_API_URL ?? "http://localhost:8090";
const nodeEnv = process.env.NODE_ENV ?? "development";

console.log({ apiBase, nodeEnv });
```

| Variable (example) | Purpose |
|---------------------|------------|
| `NODE_ENV` | `development` / `production` — log mode, caching |
| `PORT` | BFF port (3096) |
| `SHOP_API_URL` | upstream FastAPI `http://localhost:8090` |
| `LOG_LEVEL` | `info`, `debug` for pino |

Locally you copy `.env.example` → `.env`; the **dotenv** package loads the file into `process.env` ([28-env-config.md](28-env-config.md)). **Never** commit `.env` with secrets — just like `.env` in Python FastAPI.

```javascript
// Check a required variable — fail fast
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}
```

Link to shop: the BFF reads `SHOP_API_URL` and proxies to [`deploy/fastapi`](../../deploy/fastapi/README.md).

---

## Exit codes: the language of shell and CI

When a process exits, the shell receives an **exit code** (0 = success, non-zero = error):

```javascript
function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node validate.js <path>");
    process.exit(1);
  }
  // … validation OK
  process.exit(0);
}

main();
```

| Code | Meaning (Unix tradition) |
|-----|---------------------------|
| `0` | success |
| `1` | general error |
| `2` | misuse (invalid arguments) |
| `130` | interrupted by SIGINT (128 + 2) |

In GitLab CI from [`gitlab-basic`](../gitlab-basic/README.md):

```yaml
script:
  - node scripts/smoke.js
```

If `smoke.js` calls `process.exit(1)`, the job is **failed** — no try/catch in YAML. Explicit exit codes are part of the contract of CLI utilities, like the `pytest` exit code in the Python track.

**Note:** `process.exit()` terminates the process **immediately**; pending async I/O and queued `console.log` may not get a chance to run. For a server, use graceful shutdown (below).

---

## Signals: SIGINT and SIGTERM

The OS and orchestrator (Docker, Kubernetes) send **signals** to the process:

| Signal | When | Typical Node reaction |
|--------|-------|------------------------|
| **SIGINT** | Ctrl+C in the terminal | terminate |
| **SIGTERM** | `docker stop`, k8s terminate | graceful shutdown |
| **SIGHUP** | terminal reload / reload config | re-read config (rare) |

```javascript
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, closing…`);

  // Call server.close(), flush logs, disconnect DB — in nodejs-intermediate
  setTimeout(() => {
    console.log("Bye");
    process.exit(0);
  }, 500);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
```

Kubernetes gives a **grace period** (for example 30 s): during this time the BFF must stop accepting new requests and finish the current ones. This topic is in [`nodejs-advanced`](../javascript-path.md). For now — understand **why** you can't just call `process.exit(0)` on SIGTERM without closing the listen socket.

---

## uncaughtException and unhandledRejection (overview)

If an exception is **not caught** in synchronous code:

```javascript
throw new Error("sync boom");
// → uncaughtException
```

By default Node prints the stack and **terminates the process** (the behavior has changed between versions — check the LTS docs).

For a **Promise** without `.catch()`:

```javascript
Promise.reject(new Error("async boom"));
// → unhandledRejection (warning / exit depending on flags)
```

Handlers (use them deliberately, don't "swallow" every error):

```javascript
process.on("uncaughtException", (err) => {
  console.error("FATAL uncaughtException:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error("FATAL unhandledRejection:", reason);
  process.exit(1);
});
```

In Express, an **async route** without try/catch is a classic source of unhandledRejection ([24-express-errors.md](24-express-errors.md)). It's better to catch at the handler level rather than relying only on the process level.

**Antipattern:** continuing to run after `uncaughtException` — the process state may be corrupted. Usually it's log + exit + restart via PM2/k8s.

---

## process.pid, cwd, stdin/stdout

Useful fields for diagnostics:

```javascript
console.log({
  pid: process.pid,
  cwd: process.cwd(),
  version: process.version,
  platform: process.platform,
});
```

| Property | Why |
|----------|-------|
| `process.pid` | `kill`, logs, APM |
| `process.cwd()` | the shell's current working directory — see [00-environment](00-environment.md) |
| `process.stdin` / `stdout` / `stderr` | pipes, CLI ([14-lab-streams.md](14-lab-streams.md)) |

---

## Link to mock-exams

| Component | Use of process |
|-----------|------------------------|
| CLI sync to catalog | `argv`, exit 1 on error |
| BFF `npm run dev` | `PORT`, `SHOP_API_URL` |
| Docker deploy | SIGTERM, `NODE_ENV=production` |
| CI smoke | exit 0 only if `:8090/health` is OK |

Comparison with Python: `os.environ`, `sys.exit()` in FastAPI scripts — the same abstraction layer.

---

## Common mistakes

**Hardcoding `http://localhost:8090` in the code.** On staging the URL is different — only via `process.env`.

**Ignoring the exit code.** The script fails with an exception, the shell sees 0 — unless `process.exit(1)` is called in the catch. Wrap `main()` in try/catch.

**Ctrl+C while writing a file.** Without a SIGINT handler — an abort; use graceful shutdown or transactions ([11-lab-fs.md](11-lab-fs.md)).

**`.env` exists, but `process.env` is empty.** You forgot `import 'dotenv/config'` or didn't export it in CI — the variables are only in the file, not in the job's environment.

**Catching uncaughtException and "carrying on as if nothing happened".** Risk of corrupted state; the standard is exit + restart.

**Confusing `argv[0]` with the script name.** User arguments start at index 2.

---

## Summary

`process` connects Node to the OS and DevOps: **argv** for CLI, **env** for configuring the shop BFF and the FastAPI URL, **exit codes** for CI, **signals** for graceful shutdown. Process-level errors (`uncaughtException`, `unhandledRejection`) are the last line of defense; in application code prefer explicit try/catch and error middleware. The next lab will reinforce argv and env in practice.

## Checklist

- [ ] Explain the structure of `process.argv` and why `slice(2)`
- [ ] Give three env variables for the shop BFF
- [ ] What exit code does a successful CI step expect?
- [ ] The difference between SIGINT and SIGTERM in production
- [ ] Why an unhandled rejection in an async route is dangerous for the BFF
- [ ] You know where in mock-exams the FastAPI URL (`8090`) is set

Next lesson: [03. Lab: CLI scripts](03-lab-cli.md).
