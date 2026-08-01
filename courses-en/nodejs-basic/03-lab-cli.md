# 03. Lab: CLI scripts and diagnostics

## Why this lab

The theory in [00–02](00-environment.md) gave you npm, the `examples/` structure, and the `process` object. This **lab** turns that into skills you need every day on backend teams: a utility for a FastAPI smoke-check, a migration script with `--dry-run`, diagnostics for "why the BFF can't see the upstream". On the Python track the analogue is a bash/python one-shot in [`linux-basic`](../linux-basic/02-lab-shell.md); here the runtime is Node, and the contract with the shell is **exit codes** and messages on stderr.

You're not building an HTTP server yet — only a **CLI** — but the same habits apply: `cd examples`, explicit errors, env without secrets in git. The **shop** domain shows up as `SHOP_API_URL` → `http://localhost:8090` ([`deploy/fastapi`](../../deploy/fastapi/README.md)).

## Prerequisites

- Node **LTS 20+**, `npm install` run in `courses/nodejs-basic/examples/`.
- You've read [00. Environment](00-environment.md) and [02. process](02-process.md).
- Terminal open in **`examples/`**:

```bash
cd courses/nodejs-basic/examples
node --version
```

Reference solutions — `examples/solutions/` — only **after** your own attempt (5–15 minutes of being stuck).

Optional: FastAPI on `:8090` is not required for all tasks; task 4 checks the URL from env (works without a live API).

---

## Task 1. Minimal argv: a greeting

**Context:** in CI the first smoke check is "does the script even start and print the Node version".

Create `lab/01-argv.js`:

```javascript
const args = process.argv.slice(2);
const name = args[0] ?? "world";

console.log(`Hello, ${name}!`);
console.log("Node:", process.version);
console.log("Args count:", args.length);
```

```bash
node lab/01-argv.js
node lab/01-argv.js ShopBot
```

**Success criteria:** without an argument — `Hello, world!`; with an argument — the name from argv; three lines of output with no errors.

---

## Task 2. The `--help` flag and usage

**Context:** a colleague runs `node lab/02-cli.js` with no parameters and doesn't understand the interface — you need `--help`.

`lab/02-cli.js` should:

1. On `--help` or `-h`, print usage and exit with code **0**.
2. When the required `--file <path>` is missing — a message on **stderr**, exit **1**.
3. On `--file data.txt` — print `Would process: data.txt` to stdout, exit **0**.

Example usage:

```text
Usage: node lab/02-cli.js --file <path>
       node lab/02-cli.js --help
```

**Success criteria:**

```bash
node lab/02-cli.js --help          # exit 0
node lab/02-cli.js                 # stderr + exit 1
node lab/02-cli.js --file x.json   # exit 0
echo $?                            # Linux: 0; PowerShell: $LASTEXITCODE
```

---

## Task 3. Checking environment variables

**Context:** the BFF crashes in k8s with "undefined API URL" — we move the check into a separate `check-env.js` for CI.

`lab/03-check-env.js`:

1. Read `SHOP_API_URL` (default `http://localhost:8090`).
2. Read `PORT` (default `3096`).
3. If `NODE_ENV=production` and `SHOP_API_URL` contains `localhost` — a **warning** on stderr (not an exit).
4. Print JSON on one line: `{ "shopApiUrl", "port", "nodeEnv" }`.
5. Exit **0**.

Run:

```bash
node lab/03-check-env.js
SHOP_API_URL=http://staging/api node lab/03-check-env.js   # Git Bash / Linux
$env:SHOP_API_URL="http://staging/api"; node lab/03-check-env.js   # PowerShell
```

**Success criteria:** valid JSON on stdout; a warning only for production + localhost.

---

## Task 4. Graceful messages and exit code

**Context:** an "API availability check" script must distinguish "URL not set" from "URL set, but the format looks odd".

`lab/04-validate-url.js`:

1. Take the URL from `process.env.SHOP_API_URL`.
2. If not set — `ERROR: SHOP_API_URL is not set`, exit **2**.
3. If set but not starting with `http://` or `https://` — `ERROR: invalid URL scheme`, exit **1**.
4. Otherwise — `OK: will check <url>`, exit **0**.

Don't make a real `fetch` — only string validation (fetch is in [18-http-client.md](18-http-client.md)).

**Success criteria:** three scenarios with different exit codes; error messages only on stderr.

---

## Task 5. SIGINT: a polite interruption (optional+)

**Context:** a long loop of synchronous "work"; the user hits Ctrl+C.

`lab/05-sigint.js`:

```javascript
let ticks = 0;
const id = setInterval(() => {
  ticks++;
  console.log("tick", ticks);
  if (ticks >= 100) clearInterval(id);
}, 200);

process.on("SIGINT", () => {
  console.log("\nInterrupted after", ticks, "ticks");
  clearInterval(id);
  process.exit(130);
});
```

Run it, then interrupt with Ctrl+C after a few ticks.

**In a comment in the file:** why exit **130**; the link to [02-process.md](02-process.md).

---

## Success criteria (summary)

- [ ] `01`–`04` run from `examples/` without `Cannot find module`
- [ ] `02-cli.js`: `--help` → 0, without `--file` → 1
- [ ] `03-check-env.js`: JSON + production/localhost logic
- [ ] `04-validate-url.js`: exit codes 0 / 1 / 2 by condition
- [ ] You understand why stderr is for errors and stdout for data
- [ ] (Optional) `05-sigint.js` and the comment about 130

---

## If something goes wrong

| Symptom | Check |
|---------|----------|
| `ENOENT lab/01-argv.js` | `pwd` / `cd` — are you in `examples/`? |
| Exit code is always 0 on error | Explicit `process.exit(1)`; in PowerShell check `$LASTEXITCODE` |
| Env isn't picked up | Windows: `$env:VAR=...` in the same session; Linux: one line `VAR=val node …` |
| JSON breaks the parser | One line, double quotes, `JSON.stringify` |
| `import` error | `package.json` has `"type": "module"` |
| Cyrillic in stderr shows as garbage | UTF-8, Windows Terminal |

---

## Related courses

| Next step | Why |
|--------------|-------|
| [04. Event loop libuv](04-event-loop-libuv.md) | why `setInterval` in lab 05 doesn't block forever |
| [28-env-config.md](28-env-config.md) | dotenv and Zod validation |
| [20-fastapi-client.md](20-fastapi-client.md) | a real fetch to `:8090` |
| [`javascript-basic/03-lab`](../javascript-basic/03-lab-first-scripts.md) | parallel: first scripts without npm |

---

## Common mistakes

**Printing errors to stdout** — breaks pipes like `node script.js | jq`. Errors → **stderr**.

**Forgetting a default for env in lab 03** — the script should work "out of the box" on a laptop with no `.env`.

**Using `exit()` before async finishes** — there's no async in these labs; later — `await` before exit.

**Not checking the exit code in CI** — a smoke script with exit 1 should fail the job, otherwise a false green.

---

## Summary

The lab reinforced **argv**, **env**, **exit codes**, **stderr/stdout** and sketched out **SIGINT**. This is the foundation of CLI and BFF diagnostics before the event loop and HTTP. Go through the checklist in your own words — then move on to libuv.

## Checklist

- [ ] All required files lab 01–04 are created and checked
- [ ] You can explain the difference between exit 1 and exit 2 in task 4
- [ ] You know how to set env in your OS for a single run
- [ ] You wrote the `--help` usage yourself, not copied it without understanding

Next lesson (theory): [04. The event loop and libuv phases](04-event-loop-libuv.md).
