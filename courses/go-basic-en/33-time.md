# 33. The time package: Time, Parse, Format

## What you'll learn

- The `time.Time` type — a moment on the UTC timeline internally; display depends on Location.
- `time.Now()`, `time.Date`, the zero value of `time.Time`.
- `Format` and `Parse` with the reference-date layout.
- RFC3339 / ISO 8601 for APIs and JSON.
- `time.Duration`, `Sleep`, `Since`, `Until`.
- Location, and why "just add 3 hours" breaks under DST.

---

## time.Time — what it is

```go
package main

import (
	"fmt"
	"time"
)

func main() {
	now := time.Now()
	fmt.Println(now)           // 2024-06-18 13:45:00.123 +0300 MSK
	fmt.Println(now.Unix())    // seconds since 1970-01-01 UTC
	fmt.Println(now.UTC())     // the same instant, UTC zone
	fmt.Println(now.IsZero())  // false
}
```

| Method / concept | Purpose |
|-----------------|------------|
| `time.Now()` | the current moment in the OS's local zone |
| `t.UTC()` | the same instant in UTC |
| `t.IsZero()` | `true` for a zero-value `time.Time` |
| `t.Before(u)`, `After`, `Equal` | comparison |
| `t.Add(d)`, `AddDate(y, m, d)` | arithmetic |

**Zero value:** `var t time.Time` is not "now" — it's **January 1, year 1, UTC**; `IsZero()` → `true`. In JSON with `omitempty` it's usually not serialized as an empty string without custom logic — for optional dates, use `*time.Time`.

---

## The reference date — the heart of Format/Parse

Go doesn't use `%Y` and `%d`. Instead, the layout describes a **specific example**:

```text
Mon Jan 2 15:04:05 MST 2006
 1  2  3  4  5    6   7
```

| Layout component | Meaning in the reference |
|------------------|-------------------|
| `2006` | year |
| `01` | month |
| `02` | day |
| `15` | hour (24h) |
| `04` | minutes |
| `05` | seconds |
| `MST` | zone (abbreviation) |
| `-0700` | numeric offset |

Mnemonic: **01/02 03:04:05PM '06 -0700** (American month/day order in the mnemonic).

```go
t := time.Date(2024, 6, 18, 10, 30, 0, 0, time.UTC)

fmt.Println(t.Format("2006-01-02"))           // 2024-06-18
fmt.Println(t.Format("02.01.2006"))           // 18.06.2024
fmt.Println(t.Format(time.RFC3339))           // 2024-06-18T10:30:00Z
fmt.Println(t.Format("2006-01-02 15:04:05")) // 2024-06-18 10:30:00
```

**Rule:** every digit in the layout is a **fixed** part of the reference, not an arbitrary-length placeholder.

---

## Parse — string → time.Time

```go
const layout = "2006-01-02"

t, err := time.Parse(layout, "2024-06-18")
if err != nil {
	// parsing time "..." as "...": cannot parse ...
	return err
}
```

`time.Parse` interprets the time as **UTC** when the layout has no zone.

With an explicit zone:

```go
t, err := time.Parse("2006-01-02 15:04:05 -0700", "2024-06-18 10:30:00 +0300")
```

### ParseInLocation

For "the user's local time" (reports, cron in MSK):

```go
loc, _ := time.LoadLocation("Europe/Moscow")
t, err := time.ParseInLocation("2006-01-02 15:04", "2024-06-18 13:00", loc)
```

Don't confuse them: `Parse` → UTC by default; `ParseInLocation` → the given zone.

---

## RFC3339 and APIs

Constants in the `time` package:

```go
time.RFC3339     // "2006-01-02T15:04:05Z07:00"
time.RFC3339Nano
```

For HTTP and JSON — the **de facto standard**:

```go
created := time.Now().UTC()
s := created.Format(time.RFC3339)
// "2024-06-18T10:30:00Z"

parsed, err := time.Parse(time.RFC3339, s)
```

In a struct for JSON:

```go
type Task struct {
	Title     string    `json:"title"`
	CreatedAt time.Time `json:"created_at"`
}
```

`json.Marshal` serializes `time.Time` as an **RFC3339Nano** string. On `Unmarshal`, the string is parsed back into a `time.Time`.

---

## Duration and timers

```go
d := 500 * time.Millisecond
d = 2*time.Hour + 30*time.Minute

time.Sleep(d)

start := time.Now()
// ... work ...
elapsed := time.Since(start)
```

| Constant | Value |
|-----------|----------|
| `time.Nanosecond` | 1 ns |
| `time.Millisecond` | 1e6 ns |
| `time.Second` | 1e9 ns |

`time.Duration` is an **int64 of nanoseconds**, not a "date." For deadlines, use `context.WithDeadline`; here `Since`/`Until` are enough.

---

## Location and time zones

```go
utc := time.UTC
moscow, err := time.LoadLocation("Europe/Moscow")
if err != nil {
	return err
}

t := time.Now().In(moscow)
```

| Anti-pattern | Why it's bad |
|-------------|--------------|
| `t.Add(3 * time.Hour)` "for MSK" | DST, historical offsets |
| Storing local time without a zone | ambiguity when converting |
| Parsing an Excel date without a layout | different regional formats |

**In production:** store **UTC** (DB, JSON), convert to a locale only in the UI. In the capstone, `createdAt` is an RFC3339 string in UTC.

---

## Comparison and truncation

```go
a := time.Date(2024, 6, 18, 10, 0, 0, 0, time.UTC)
b := time.Date(2024, 6, 18, 11, 0, 0, 0, time.UTC)

a.Before(b) // true
a.Equal(b)  // false

trunc := b.Truncate(time.Hour) // zero out minutes/seconds within the hour
```

For "date only" without a time, it's common to store `time.Date(y, m, d, 0, 0, 0, 0, loc)` or a separate type/string — it depends on the domain.

---

## Unix timestamps and ParseDuration

For logs and external APIs, sometimes a **number of seconds** arrives (not an RFC3339 string):

```go
sec := int64(1718706600)
t := time.Unix(sec, 0).UTC()
fmt.Println(t.Format(time.RFC3339))

nano := time.Unix(0, 1718706600123456789) // sec + nanosec
```

The other direction:

```go
t.Unix()     // seconds
t.UnixMilli() // milliseconds (Go 1.17+)
```

**Durations** in configs (`timeout: 30s`):

```go
d, err := time.ParseDuration("1h30m")
if err != nil {
	return err
}
deadline := time.Now().Add(d)
```

`ParseDuration` understands `ns`, `us`, `µs`, `ms`, `s`, `m`, `h` — don't confuse it with parsing a calendar date.

---

## Common mistakes

1. **A layout with `%Y-%m-%d`** — Go doesn't understand it; you need a layout built from the reference date.

2. **`Parse` without a zone** — you expected MSK, you got UTC.

3. **Comparing date strings** `"2024-06-18" < "2024-06-9"` — lexicographically wrong; compare `time.Time` values instead.

4. **Forgetting `.UTC()` before writing to JSON** — clients in different zones see a different "day."

5. **A zero `time.Time` in an API** — it comes out as `"0001-01-01T00:00:00Z"`; use a pointer or omitempty plus custom logic.

6. **Monotonic clock reads** — `time.Since` is fine for measurements; for legally significant timestamps, use `time.Now()` — Go handles the monotonic part internally in comparisons.

---

## In production

- Logs and traces: UTC + RFC3339Nano.
- User input: an explicit layout + `ParseInLocation` + validation.
- Tests: **don't** call `time.Now()` directly — inject a fixed time (in advanced courses, a clock interface; at the basic level, a function parameter `now func() time.Time`).

```go
func formatOrderID(t time.Time) string {
	return t.UTC().Format("20060102") + "-001"
}
```

---

## Summary

`time.Time` is a moment; `Duration` is an interval. Formatting goes through a layout built from **2006-01-02 15:04:05**. For APIs — `RFC3339` and UTC. Time zones — through `Location`, not a manual offset.

---

## Checklist

- [ ] I remember the reference date `2006-01-02 15:04:05`
- [ ] I use `time.RFC3339` for JSON/APIs
- [ ] I distinguish `Parse` (UTC by default) from `ParseInLocation`
- [ ] I store UTC and show a locale deliberately
- [ ] I don't compare dates as strings

**Next:** [34-files-io.md](34-files-io.md) — reading and writing files for persistence.
