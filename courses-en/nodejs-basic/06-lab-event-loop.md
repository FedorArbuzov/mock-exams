# 06. Lab: output order and blocking the event loop

## Why this lab matters

In production, "everything is slow" while CPU sits at 15% — that's often a **blocked event loop**, not "not enough cores." In interviews, you're asked to reproduce **1, 4, 3, 2** from [`javascript-basic/24-event-loop`](../javascript-basic/24-event-loop.md) and explain microtasks vs. timers. The theory in [04–05](04-event-loop-libuv.md) doesn't stick without hands-on practice: the log order looks like magic until you run the file ten times and add `nextTick` / `setImmediate`.

The lab is **no HTTP, no npm packages** — just `node lab/…` from `examples/`. The shop domain isn't required here; the skill transfers directly to BFF work: why sync-parsing a catalog kills `:3096` under load.

## Prerequisites

- Read [04. Event loop and libuv](04-event-loop-libuv.md) and [05. nextTick / setImmediate](05-nexttick-setimmediate.md).
- Directory: `courses/nodejs-basic/examples/`.
- Worth refreshing javascript-basic [24-event-loop](../javascript-basic/24-event-loop.md).

```bash
cd courses/nodejs-basic/examples
node --version
```

Reference solutions are in `solutions/` — check them only after your own attempt.

---

## Task 1. The classic 1, 4, 3, 2

**Context:** a CI unit test checks whether the developer understands microtasks.

Create `lab/06-classic-order.js`:

```javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

Promise.resolve().then(() => {
  console.log("3");
});

console.log("4");
```

```bash
node lab/06-classic-order.js
```

**In a comment in the file** (5–8 sentences): walk through, step by step, why the order is **1 → 4 → 3 → 2**. Mention the call stack, microtasks, and macrotasks (the timers phase).

**Success criterion:** output is exactly four lines in the order shown.

---

## Task 2. Extended order: nextTick and queueMicrotask

**Context:** BFF logs mixing APIs from [05-nexttick-setimmediate.md](05-nexttick-setimmediate.md).

`lab/07-full-order.js` — reproduce this code:

```javascript
console.log("A sync");

process.nextTick(() => console.log("B nextTick"));

Promise.resolve().then(() => console.log("C promise"));

queueMicrotask(() => console.log("D microtask"));

setTimeout(() => console.log("E timeout"), 0);

setImmediate(() => console.log("F immediate"));

console.log("G sync");
```

Record the **actual** output from your Node version. In a comment:

1. Why `B` comes before `C` and `D`.
2. Why `A` and `G` come first.
3. Why `E` and `F` come last, and whether their relative order can vary.

**Success criterion:** the file runs; the comment matches the actual output.

---

## Task 3. async/await and the event loop

**Context:** an Express handler with `async` — when does the code after `await` actually run?

`lab/08-async-order.js`:

```javascript
async function loadLabel() {
  console.log("loadLabel: start");
  await Promise.resolve();
  console.log("loadLabel: after await");
  return "shop-catalog";
}

console.log("main: before");
loadLabel().then((v) => console.log("main: then", v));
console.log("main: after");
```

**Success criterion:** predict the output **before** running it, then check yourself. In the comment, connect this to [javascript-basic/27-async-await](../javascript-basic/27-async-await.md).

---

## Task 4. Blocking the loop (required)

**Context:** "the BFF hung" — a sync busy-wait in middleware.

`lab/09-block-loop.js`:

```javascript
console.log("block demo: start");

setTimeout(() => console.log("block demo: timer fired"), 100);

const deadline = Date.now() + 2000;
while (Date.now() < deadline) {
  // intentionally block event loop ~2s
}

console.log("block demo: sync end");
```

Run it and record the **delay** before `timer fired` appears relative to `sync end`.

**In a comment:** why the ~2s timer fires late; what would happen to a second HTTP request to the BFF during that window. Link back to [04-event-loop-libuv.md](04-event-loop-libuv.md).

**Success criterion:** three log lines; the timer fires after `sync end`; you understand why the loop was blocked.

---

## Task 5. A non-blocking alternative (optional)

**Context:** splitting work up via `setImmediate` (a learning pattern; in production you'd use workers).

`lab/10-yield-immediate.js` — count from 0 to 1,000,000 **without** a 2-second timer freeze:

```javascript
let n = 0;
const limit = 1_000_000;
const chunk = 100_000;

console.log("yield: start");
setTimeout(() => console.log("yield: timer OK"), 50);

function work() {
  const end = Math.min(n + chunk, limit);
  while (n < end) n++;
  if (n < limit) {
    setImmediate(work);
  } else {
    console.log("yield: done", n);
  }
}

setImmediate(work);
```

**Success criterion:** `timer OK` prints **before** `yield: done`; in the comment, explain why `setImmediate` and not `process.nextTick` in a loop.

---

## Success criteria (summary)

- [ ] `06-classic-order.js` — order 1,4,3,2 and comment
- [ ] `07-full-order.js` — full output and explanation of B/C/D/E/F
- [ ] `08-async-order.js` — prediction + verification
- [ ] `09-block-loop.js` — demonstrates the timer being blocked
- [ ] (Optional) `10-yield-immediate.js` — timer before done
- [ ] You can explain to a colleague the difference between "async I/O" and "blocked loop"

---

## If something goes wrong

| Symptom | Check |
|---------|-------|
| Order isn't 1,4,3,2 | Extra top-level `await`? Use plain Node, no bundler |
| `queueMicrotask is not defined` | Node 11+; update your LTS |
| The timer in lab 09 fires immediately | Did you remove the `while`? It should block for ~2s |
| setImmediate vs. timeout look the same | Normal in the main module; see the comment in lab 07 |
| Process doesn't exit | `setImmediate`/`setTimeout` still queued — add one or wait |
| Flaky E/F order | Document your Node version in the comment |

---

## Connections in the course

| Material | Connection |
|----------|------------|
| [07-python-async-comparison.md](07-python-async-comparison.md) | asyncio sleep(0) vs. setImmediate |
| [08-async-io-patterns.md](08-async-io-patterns.md) | fs.promises instead of sync |
| [javascript-basic/28-lab-async](../javascript-basic/28-lab-async.md) | a parallel lab in the browser track |

---

## Common mistakes

**Peeking at the reference solution before your own output** — predict first, then run `node`.

**Confusing the "100 ms timer" with the "2000 ms block"** — the timer can't fire while the loop is busy with sync work.

**Using nextTick instead of setImmediate in lab 10** — the timer can be delayed even more severely (starvation).

---

## Summary

This lab cemented **1,4,3,2**, the **nextTick / microtask / timer / immediate** queues, **async/await** ordering, and **blocking the loop** vs. the **setImmediate yield** pattern. This is the foundation for async I/O toward FastAPI `:8090` and Express handlers without "mysterious" hangs.

## Checklist

- [ ] All required lab files (06–09) created
- [ ] Comments in the code are in your own words, not copy-pasted from the lesson
- [ ] You ran everything from `examples/`
- [ ] You can sketch the diagram: sync → nextTick → microtasks → macrotask

Next lesson (theory): [07. Comparison with python-async](07-python-async-comparison.md).
