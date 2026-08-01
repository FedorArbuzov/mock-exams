# 18. Lab: modern syntax

## Lab goal

Apply [17. Destructuring, spread, rest](17-destructuring-spread.md) and elements of [19. Optional chaining and nullish](19-optional-nullish.md) to tasks similar to a BFF and log parsing. After the lab you will comfortably write `mergeConfig`, `pick`/`omit`, and safely parse string records without a dozen `if`s.

**Time:** ~45–55 minutes.  
**Environment:** Node.js LTS, `"type": "module"`.

## Setup

File `lab/18-modern-syntax.js` (or separate files per function):

```javascript
export function parseLogLine(line) { /* ... */ }
export function mergeConfig(base, override) { /* ... */ }
export function pick(obj, keys) { /* ... */ }
export function omit(obj, keys) { /* ... */ }
export function rotate(arr, n) { /* ... */ }
```

A simple runner at the bottom of the file or a separate `18-test.mjs` with `console.assert`.

---

## Task 1. Parsing a log line

### Scenario

An agent on the server writes single-line logs. You need to turn the string into an object to send to monitoring (analogous to structured logs in nodejs-advanced).

### Format

```
2024-06-18T10:00:00Z ERROR auth login failed user=42
```

Fields:

| Field | Rule |
|------|---------|
| `timestamp` | first token (ISO) |
| `level` | second token (`ERROR`, `INFO`, …) |
| `module` | third token |
| `message` | everything up to `user=` or to the end |
| `userId` | number after `user=`, **only if** the substring is present |

### Signature

```javascript
export function parseLogLine(line) {
  const [timestamp, level, module, ...rest] = line.split(" ");
  const tail = rest.join(" ");
  const userMatch = tail.match(/user=(\d+)/);

  const message = userMatch
    ? tail.slice(0, userMatch.index).trim()
    : tail.trim();

  return {
    timestamp,
    level,
    module,
    message,
    ...(userMatch ? { userId: Number(userMatch[1]) } : {}),
  };
}
```

Implement it yourself; the code above is a reference to check after attempting.

### Verification

```javascript
const a = parseLogLine(
  "2024-06-18T10:00:00Z ERROR auth login failed user=42"
);
console.assert(a.userId === 42);
console.assert(a.message === "login failed");

const b = parseLogLine("2024-06-18T11:00:00Z INFO http GET /health");
console.assert(b.userId === undefined);
console.assert(b.module === "http");
```

### Hints

- `split(" ")` cuts on spaces — for a `message` with spaces, assemble `rest.join(" ")`.
- Conditional field: object spread `...(cond ? { userId: n } : {})` or build the object and assign the field when present.
- `userId` is a number, not a string.

### Criteria

- [ ] All required fields are extracted.
- [ ] `userId` only when `user=` is present.
- [ ] Empty or malformed string — decide yourself: `throw` or a partial object (document it).

---

## Task 2. mergeConfig

### Scenario

Application config: defaults in the repository, override from env and CLI flags. You **must not** mutate `base` — workers share the reference.

### Signature

```javascript
export function mergeConfig(base, override) {
  return { ...base, ...override };
}
```

### Verification

```javascript
const base = { host: "localhost", port: 3000, debug: false };
const override = { port: 8080 };
const merged = mergeConfig(base, override);

console.assert(merged.port === 8080);
console.assert(base.port === 3000);
console.assert(merged.host === "localhost");
```

### Extension

```javascript
export function mergeConfig(base, override = {}) {
  return { ...base, ...override };
}
```

Discuss shallow merge: `base.nested` and `merged.nested` are the same reference. How do you merge `meta` deeply? `{ ...base, meta: { ...base.meta, ...override.meta } }`.

### Criteria

- [ ] `base` is unchanged after the merge.
- [ ] Fields from `override` override `base`.
- [ ] A **new** object is returned.

---

## Task 3. pick and omit

### Scenario

Before logging a user object you need to remove `passwordHash`; a PATCH sends only the allowed fields.

### Signatures

```javascript
export function pick(obj, keys) {
  return Object.fromEntries(
    keys.filter((k) => k in obj).map((k) => [k, obj[k]])
  );
}

export function omit(obj, keys) {
  const exclude = new Set(keys);
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => !exclude.has(k))
  );
}
```

An implementation via reduce or rest after destructuring is acceptable for omitting known keys.

### Verification

```javascript
const user = { id: 1, name: "Ann", role: "admin", passwordHash: "xxx" };

const publicUser = omit(user, ["passwordHash"]);
console.assert(publicUser.passwordHash === undefined);
console.assert(user.passwordHash === "xxx");

const patch = pick(user, ["name", "role"]);
console.assert(Object.keys(patch).length === 2);
```

### Criteria

- [ ] `pick` / `omit` return new objects.
- [ ] The original `user` is not mutated.
- [ ] `pick` with a nonexistent key — does not add `undefined` (or explicitly document otherwise).

---

## Task 4. swap and rotate

### Swap (demonstration)

Without a temporary variable:

```javascript
let x = 1;
let y = 2;
[x, y] = [y, x];
console.assert(x === 2 && y === 1);
```

### rotate

Shift the array left by `n` positions (normalize `n` by the length):

```javascript
export function rotate(arr, n) {
  const len = arr.length;
  if (len === 0) return [];
  const k = ((n % len) + len) % len;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

console.assert(JSON.stringify(rotate([1, 2, 3, 4], 2)) === JSON.stringify([3, 4, 1, 2]));
console.assert(JSON.stringify(rotate([1, 2, 3, 4], 0)) === JSON.stringify([1, 2, 3, 4]));
```

### Step by step: rotate([1,2,3,4], 2)

1. `k = 2`.
2. `slice(2)` → `[3, 4]`.
3. `slice(0, 2)` → `[1, 2]`.
4. spread → `[3, 4, 1, 2]`.

### Criteria

- [ ] The original array is not mutated.
- [ ] `rotate(arr, 0)` and `rotate(arr, len)` — a copy with the same order.

---

## Task 5 (bonus). normalizePort

```javascript
export function normalizePort(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : 3000;
}
```

Compare with `value || 3000` — why does `0` break `||`? See [19](19-optional-nullish.md): `value ?? 3000` after a `Number` check.

---

## Summary checklist

- [ ] `parseLogLine` extracts `userId` only when `user=` is present
- [ ] `mergeConfig` does not change `base`
- [ ] `pick` / `omit` — new objects
- [ ] `rotate` via slice + spread
- [ ] You understand shallow merge and the risk of a shared `nested`

## Common mistakes

| Mistake | Cause |
|--------|---------|
| `Object.assign(base, override)` | Mutates base |
| `const { ...rest, id } = o` | rest is not last |
| `parseLogLine` without joining rest | message truncated to one word |
| `rotate` mutates `arr` | `push`/`splice` on the source |

## Relation to the course

| Topic | Lesson |
|------|------|
| Spread / rest | [17](17-destructuring-spread.md) |
| `??` for defaults | [19](19-optional-nullish.md) |
| Shallow copy | [07](07-objects.md) |
| Arrays | [08](08-arrays.md) |
| Env merge in Node | nodejs-basic |

## Mini-quiz (oral)

1. How does `omit` differ from `delete obj.key`?
2. Why is `{ ...base, ...override }` safer than `base.port = override.port`?

Next lesson: [19. Optional chaining and nullish](19-optional-nullish.md).
