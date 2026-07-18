# Golang Shorts: Complete beginner course

Goal: turn shorts into a coherent course that takes a beginner from “why Go?” to confident day-to-day practice.
Recommended length per video: 45–75 seconds (a bit over one minute when the topic needs texture).

Shared CTA (end of every short):
`Master Go faster. Theory, hands-on labs, and interview questions — link in bio.`

Brand footer on video (series standard):
`exallenge.tech` — small, persistent, phone-safe. No QR code.

Module order = study order: why Go → setup → syntax → types → control flow → functions → structs/slices/maps → interfaces → errors → concurrency → stdlib → testing → HTTP/APIs → tooling → production → career.

---

## Module 0. Why Go and how to think in Go (1–12)

Format for every item in this and the following modules:
- **Hook:** a short beginner question/pain for the lesson topic.
- **Core:** a simple explanation + 1 practical anchor (command/rule/checklist).
- **CTA:** `Master Go faster. Theory, hands-on labs, and interview questions — link in bio.`

1. What is Go in 30 seconds  
   - **Hook:** "Another language — why should I care about Go?"
   - **Core:** Go is a simple, compiled language built for readable concurrent backend services and tooling.
2. Why companies hire for Go  
   - **Hook:** "Is Go only for Google?"
   - **Core:** Teams pick Go for fast builds, small binaries, strong stdlib, and boring reliability in APIs and infra.
3. Go vs Python for backends  
   - **Hook:** "I know Python — why switch?"
   - **Core:** Python wins for speed of experimentation; Go wins for static types, concurrency model, and deployable binaries.
4. Go vs Java/C# mental model  
   - **Hook:** "Is Go just a simpler Java?"
   - **Core:** Less ceremony, no class inheritance maze — structs, interfaces, and composition do the heavy lifting.
5. Compiled binary mindset  
   - **Hook:** "Where is my virtualenv for Go?"
   - **Core:** `go build` produces a binary you ship; fewer runtime surprises than interpreted stacks.
6. “Boring technology” is a feature  
   - **Hook:** "Why does Go feel plain on purpose?"
   - **Core:** Fewer clever features means more readable team code and fewer dialect wars.
7. When Go is a great fit  
   - **Hook:** "What projects deserve Go first?"
   - **Core:** CLIs, APIs, proxies, workers, Kubernetes-related tooling, and high-concurrency services.
8. When Go is *not* ideal  
   - **Hook:** "Should everything be rewritten in Go?"
   - **Core:** Skip Go for heavy GUI apps, tiny scripts, or domains where another ecosystem already dominates.
9. Go proverb: clarity over cleverness  
   - **Hook:** "What does idiomatic Go even mean?"
   - **Core:** Prefer clear names, small functions, and explicit error handling over magic abstractions.
10. The Go toolchain is part of the language  
   - **Hook:** "Is `go` just a compiler?"
   - **Core:** One toolchain covers build, test, format, modules, and vet — learn it early.
11. Myth: “Go has no generics so it’s useless”  
   - **Hook:** "Didn't Go refuse generics forever?"
   - **Core:** Generics exist now; still use them sparingly where they remove real duplication.
12. Roadmap: what “junior Go” actually means  
   - **Hook:** "What skills get you hired?"
   - **Core:** Syntax, modules, errors, interfaces, goroutines/channels basics, testing, and a small HTTP service.

---

## Module 1. Install and first program (13–24)

13. Install Go the clean way  
   - **Hook:** "Which installer should I trust?"
   - **Core:** Install the official toolchain, then verify with `go version`.
14. `GOROOT` vs `GOPATH` today  
   - **Hook:** "Do I still need to fight GOPATH?"
   - **Core:** Modules made day-to-day work module-local; know the terms, don’t overconfigure.
15. Your editor setup for Go  
   - **Hook:** "VS Code or GoLand?"
   - **Core:** Any editor with gopls is fine — autocomplete and jump-to-def matter more than the brand.
16. `gopls`: the language server  
   - **Hook:** "Why is my editor suddenly smart?"
   - **Core:** gopls powers diagnostics, renames, and navigation; keep it updated with the toolchain.
17. First file: `main` package  
   - **Hook:** "Where does execution start?"
   - **Core:** `package main` + `func main()` is the entrypoint for runnable programs.
18. `Hello, World` and why `fmt` matters  
   - **Hook:** "Why not just print somehow?"
   - **Core:** `fmt` is the standard way to format and print; learn verbs early.
19. `go run` vs `go build`  
   - **Hook:** "When do I compile?"
   - **Core:** `go run` is for quick tries; `go build` / `go install` are for real artifacts.
20. Exit codes and failing fast  
   - **Hook:** "How do CLIs signal failure?"
   - **Core:** Non-zero exit means failure — useful for scripts and CI.
21. Comments that help (and ones that don’t)  
   - **Hook:** "Should every line have a comment?"
   - **Core:** Comment why and exported behavior; don’t narrate obvious code.
22. `gofmt` / `go fmt`: non-negotiable style  
   - **Hook:** "Who decides tabs and braces?"
   - **Core:** The formatter decides — run it always so reviews stay about logic.
23. `go vet`: cheap static checks  
   - **Hook:** "What catches silly bugs before tests?"
   - **Core:** `go vet` finds common mistakes; run it in CI early.
24. Mini checklist: first Go hour  
   - **Hook:** "What should I have working tonight?"
   - **Core:** version OK, editor+gopls, hello runs, fmt+vet habit started.

---

## Module 2. Packages, modules, and project shape (25–38)

25. Packages vs modules  
   - **Hook:** "Are package and module the same?"
   - **Core:** A module is a versioned dependency unit; a package is a compile unit inside folders.
26. `go.mod` in plain words  
   - **Hook:** "What is this go.mod file?"
   - **Core:** It declares your module path and dependencies — the project identity.
27. `go get` / `go mod tidy`  
   - **Hook:** "How do dependencies not rot?"
   - **Core:** Add what you import; `go mod tidy` keeps go.mod/go.sum honest.
28. Module paths and import paths  
   - **Hook:** "Why do imports look like URLs?"
   - **Core:** Import paths identify modules uniquely — usually the repo path.
29. Internal packages (`internal/`)  
   - **Hook:** "How do I hide code from outsiders?"
   - **Core:** `internal` packages can only be imported by their parent tree.
30. `cmd/` and `internal/` layout  
   - **Hook:** "How should I structure a real repo?"
   - **Core:** Put mains under `cmd/`, shared private code under `internal/`.
31. One package per folder rule  
   - **Hook:** "Can two packages share a directory?"
   - **Core:** No — each directory is one package name (tests aside).
32. Exported vs unexported names  
   - **Hook:** "Why does capital letter matter so much?"
   - **Core:** Uppercase = exported across packages; lowercase stays private.
33. Doc comments on exported symbols  
   - **Hook:** "Where does Go documentation come from?"
   - **Core:** `// Foo ...` above exported Foo becomes `go doc` / pkg.go.dev text.
34. `go doc` locally  
   - **Hook:** "How do I read docs offline?"
   - **Core:** `go doc fmt.Println` prints docs in the terminal.
35. Replace directives (when hacking deps)  
   - **Hook:** "How do I test a local dependency fork?"
   - **Core:** `replace` in go.mod points to a local path — useful temporarily.
36. Semantic import versioning (v2+)  
   - **Hook:** "Why do major versions change import paths?"
   - **Core:** From v2 up, major version appears in the module path.
37. Vendoring basics  
   - **Hook:** "Should I vendor dependencies?"
   - **Core:** `go mod vendor` copies deps into the repo for hermetic builds when needed.
38. Mini checklist: healthy Go module  
   - **Hook:** "When is my module ‘clean’?"
   - **Core:** builds, tidy, clear module path, no mystery deps, docs on exports.

---

## Module 3. Variables, types, and zero values (39–54)

39. Short declare `:=` vs `var`  
   - **Hook:** "Which declaration should I use?"
   - **Core:** `:=` inside functions for brevity; `var` when you need zero value or package-level.
40. Zero values everywhere  
   - **Hook:** "What is in an uninitialized variable?"
   - **Core:** Every type has a useful zero: `0`, `""`, `false`, `nil` — design around it.
41. Basic types: int, float, bool, string  
   - **Hook:** "Which int should I pick?"
   - **Core:** Prefer `int` unless size/encoding requires `int64`/`uint32`/etc.
42. Type conversion is explicit  
   - **Hook:** "Why won’t Go cast silently?"
   - **Core:** Conversions are written out — fewer surprise overflows and bugs.
43. Constants and `iota`  
   - **Hook:** "How do enums work in Go?"
   - **Core:** Typed constants + `iota` give readable enumerations without classes.
44. Strings are immutable byte sequences  
   - **Hook:** "Can I change s[0] = 'A'?"
   - **Core:** Strings are immutable; build with builder/slice tricks carefully.
45. Runes vs bytes  
   - **Hook:** "Why is len('й') not what I expect?"
   - **Core:** `len(string)` is bytes; range over runes for Unicode characters.
46. Raw string literals  
   - **Hook:** "How do I paste a multiline path or regex?"
   - **Core:** Backtick strings keep newlines and skip most escaping.
47. Pointers without fear  
   - **Hook:** "Do I need pointer arithmetic?"
   - **Core:** Pointers share/mutate values; no pointer math — keep it simple.
48. When to pass pointer vs value  
   - **Hook:** "Should everything be a pointer?"
   - **Core:** Use pointers for mutation or large structs; values for small immutable data.
49. `new` vs `&Type{}`  
   - **Hook:** "Which way allocates a pointer?"
   - **Core:** Both work; composite literals are usually clearer than `new`.
50. Type aliases vs defined types  
   - **Hook:** "Why create `type UserID int`?"
   - **Core:** Defined types prevent mixing incompatible meanings at compile time.
51. Named results (use sparingly)  
   - **Hook:** "Are named return values idiomatic?"
   - **Core:** Useful for docs/defer clarity; confusing if overused.
52. Shadowing bugs with `:=`  
   - **Hook:** "Why did my outer err never update?"
   - **Core:** `:=` can create a new inner variable — watch scopes in if/err handling.
53. `any` (alias for `interface{}`)  
   - **Hook:** "Is `any` an escape hatch?"
   - **Core:** Yes — use when needed, then restore type safely.
54. Mini checklist: types without pain  
   - **Hook:** "What should I verify in reviews?"
   - **Core:** zero values handled, conversions explicit, no accidental shadowing.

---

## Module 4. Control flow and idioms (55–66)

55. `if` with short statement  
   - **Hook:** "Why put err := on the if line?"
   - **Core:** Scopes the temporary binding to the if/else — common Go idiom.
56. `switch` without fallthrough surprise  
   - **Hook:** "Does switch fall through like C?"
   - **Core:** No automatic fallthrough; cases break by default.
57. Type switch  
   - **Hook:** "How do I branch on dynamic type?"
   - **Core:** `switch v := x.(type)` handles multiple concrete types cleanly.
58. `for` is the only loop  
   - **Hook:** "Where is while?"
   - **Core:** `for` covers while/for/infinite loops — one keyword to master.
59. `range` over slices, maps, channels  
   - **Hook:** "What does range give me?"
   - **Core:** Index/key and value; remember map iteration order is randomized.
60. `break`, `continue`, labels  
   - **Hook:** "How do I break an outer loop?"
   - **Core:** Labels exist — use rarely and keep them obvious.
61. Early return style  
   - **Hook:** "Why so many guard clauses?"
   - **Core:** Happy path stays unindented; errors exit early.
62. Prefer clarity over nested else  
   - **Hook:** "My function is a Christmas tree of braces"
   - **Core:** Flatten with early returns and small helpers.
63. `defer` basics  
   - **Hook:** "Who closes the file if I return early?"
   - **Core:** `defer` schedules cleanup when the function exits.
64. `defer` gotchas with loops  
   - **Hook:** "Why did all deferred closes pile up?"
   - **Core:** Defers run at function end — wrap loop bodies in functions when needed.
65. `panic` and `recover` (rare)  
   - **Hook:** "Is panic my exception system?"
   - **Core:** Panic is for truly exceptional bugs; recover at boundaries only.
66. Mini checklist: readable control flow  
   - **Hook:** "What does clean Go branching look like?"
   - **Core:** early returns, small switches, defer for cleanup, almost no panic.

---

## Module 5. Functions, methods, and structuring code (67–80)

67. Multiple return values  
   - **Hook:** "Why return (T, error) everywhere?"
   - **Core:** Explicit results beat hidden exceptions — especially for errors.
68. Variadic functions  
   - **Hook:** "How does fmt.Println take many args?"
   - **Core:** `...T` collects arguments into a slice.
69. Passing functions as values  
   - **Hook:** "Does Go have first-class functions?"
   - **Core:** Yes — callbacks and options patterns are normal.
70. Closures  
   - **Hook:** "Why does my goroutine print the wrong i?"
   - **Core:** Closures capture variables; be careful with loop variables.
71. Methods on types  
   - **Hook:** "Where do I put behavior?"
   - **Core:** Methods bind functions to a receiver type — value or pointer.
72. Pointer receivers vs value receivers  
   - **Hook:** "Which receiver should I choose?"
   - **Core:** Pointer if you mutate or avoid copies; be consistent on the type.
73. Embedding structs (composition)  
   - **Hook:** "Is this inheritance?"
   - **Core:** Embedding promotes fields/methods — composition, not OOP hierarchy.
74. Constructor functions `NewType`  
   - **Hook:** "Where is my class constructor?"
   - **Core:** `NewFoo(...) (*Foo, error)` is the idiomatic constructor pattern.
75. Options pattern for configs  
   - **Hook:** "How do I avoid 12-parameter constructors?"
   - **Core:** Functional options or config structs keep APIs extensible.
76. Pure functions vs side effects  
   - **Hook:** "Why are my tests painful?"
   - **Core:** Separate decision logic from IO so unit tests stay easy.
77. Package API design: small surface  
   - **Hook:** "How much should I export?"
   - **Core:** Export the minimum; keep helpers unexported.
78. Avoid huge “utils” packages  
   - **Hook:** "Is utils.go a smell?"
   - **Core:** Prefer domain-named packages over junk drawers.
79. Init functions carefully  
   - **Hook:** "Should I put setup in init()?"
   - **Core:** `init` runs implicitly — prefer explicit setup for testability.
80. Mini checklist: function design  
   - **Hook:** "What makes a Go function ‘done’?"
   - **Core:** clear name, small job, explicit errors, consistent receivers.

---

## Module 6. Structs, slices, maps (81–96)

81. Struct literals  
   - **Hook:** "How do I construct a struct clearly?"
   - **Core:** Prefer keyed fields: `User{Name: "A"}` resists breakage.
82. Slices vs arrays  
   - **Hook:** "Aren’t they the same?"
   - **Core:** Arrays have fixed size in the type; slices are dynamic views used everywhere.
83. Slice internals: ptr, len, cap  
   - **Hook:** "Why did appending change another slice?"
   - **Core:** Slices share backing arrays until growth — know len/cap.
84. `append` rules of thumb  
   - **Hook:** "Is append always safe?"
   - **Core:** Reassign: `s = append(s, x)`; beware shared backing arrays.
85. Slicing slices `[a:b]`  
   - **Hook:** "Does slicing copy data?"
   - **Core:** Usually a new header on the same array — copy explicitly when needed.
86. `copy` for real copies  
   - **Hook:** "How do I detach from the backing array?"
   - **Core:** `copy(dst, src)` or `slices.Clone` depending on version/style.
87. Maps basics  
   - **Hook:** "What’s Go’s dictionary type?"
   - **Core:** `map[K]V` — keys must be comparable; ranging order is random.
88. comma-ok map lookup  
   - **Hook:** "How do I tell missing from zero value?"
   - **Core:** `v, ok := m[k]` — always use ok when zero is valid data.
89. Never concurrently mutate maps unprotected  
   - **Hook:** "Why did my program crash randomly?"
   - **Core:** Map concurrent write is undefined — sync or confine to one goroutine.
90. Making maps and slices  
   - **Hook:** "make vs literal?"
   - **Core:** `make` sets length/capacity; literals are great for fixed content.
91. Nil slice vs empty slice  
   - **Hook:** "Is nil slice usable?"
   - **Core:** You can append to nil slices; JSON encodes nil vs [] differently — know the difference.
92. Struct tags for JSON/DB  
   - **Hook:** "What are those `json:\"name\"` things?"
   - **Core:** Tags drive encoding/orm mapping — keep them accurate.
93. Comparing structs  
   - **Hook:** "Can I use == on structs?"
   - **Core:** Yes if all fields are comparable; otherwise compare explicitly.
94. Memory hint: avoid huge copies accidentally  
   - **Hook:** "My function is slow with big structs"
   - **Core:** Pass pointers or redesign — measure before micro-optimizing.
95. `slices` and `maps` std packages (modern Go)  
   - **Hook:** "Do I still write helpers by hand?"
   - **Core:** Prefer std helpers when available for clarity.
96. Mini checklist: collections  
   - **Hook:** "What do I verify with slices/maps?"
   - **Core:** ownership of backing array, ok-idiom, no racy map writes.

---

## Module 7. Interfaces — the real power tool (97–110)

97. Interfaces are satisfied implicitly  
   - **Hook:** "Where is implements Keyword?"
   - **Core:** If methods match, the type implements the interface — no declaration required.
98. Small interfaces win  
   - **Hook:** "Why is io.Reader famous?"
   - **Core:** One-method interfaces compose and stay mockable.
99. Accept interfaces, return structs  
   - **Hook:** "What should function signatures look like?"
   - **Core:** Depend on small interfaces at boundaries; return concrete types for construction.
100. `io.Reader` / `io.Writer` mindset  
   - **Hook:** "How does Go glue IO together?"
   - **Core:** Stream interfaces let files, buffers, and network sockets share APIs.
101. Interface values: type + value  
   - **Hook:** "Why is a nil pointer not a nil interface?"
   - **Core:** Interface can hold typed nil — classic gotcha in error checks.
102. Empty interface / `any` uses  
   - **Hook:** "When is any acceptable?"
   - **Core:** Containers and decoding boundaries; restore types ASAP.
103. Type assertions  
   - **Hook:** "How do I get the concrete type back?"
   - **Core:** `v, ok := i.(T)` — always prefer the ok form.
104. Composition of interfaces  
   - **Hook:** "Can interfaces embed interfaces?"
   - **Core:** Yes — `ReadWriter` style composition is idiomatic.
105. Avoid “god interfaces”  
   - **Hook:** "My interface has 20 methods"
   - **Core:** Split by consumer need; fat interfaces freeze designs.
106. Mocking with interfaces  
   - **Hook:** "How do I unit test a DB call?"
   - **Core:** Depend on an interface; supply a fake in tests.
107. Behavior docs > inheritance trees  
   - **Hook:** "How do I model domains without classes?"
   - **Core:** Describe what things do via interfaces and composition.
108. Interface pollution smell  
   - **Hook:** "Should every struct have an interface?"
   - **Core:** Create interfaces where you have multiple implementations or need testing seams.
109. `fmt.Stringer` and handy std interfaces  
   - **Hook:** "How do I control string printing?"
   - **Core:** Implement `String()` for readable logs and debug output.
110. Mini checklist: interface design  
   - **Hook:** "Is this interface justified?"
   - **Core:** small, consumer-defined, implicitly satisfied, tested with a second implementation.

---

## Module 8. Errors — explicit and boring (on purpose) (111–124)

111. Errors are values  
   - **Hook:** "Why not exceptions?"
   - **Core:** Return `error` and handle it — control flow stays visible.
112. `error` interface  
   - **Hook:** "What is an error really?"
   - **Core:** Anything with `Error() string`; std and custom types both work.
113. `fmt.Errorf` and `%w` wrapping  
   - **Hook:** "How do I add context without losing the cause?"
   - **Core:** Wrap with `%w` so `errors.Is`/`As` still work.
114. `errors.Is`  
   - **Hook:** "How do I check for a sentinel error?"
   - **Core:** `errors.Is(err, ErrNotFound)` walks the wrap chain.
115. `errors.As`  
   - **Hook:** "How do I extract a structured error type?"
   - **Core:** `errors.As(err, &target)` finds matching concrete types.
116. Sentinel errors  
   - **Hook:** "When do I export `var ErrX = errors.New(...)`?"
   - **Core:** For expected conditions callers must branch on.
117. Custom error types  
   - **Hook:** "When is a string error not enough?"
   - **Core:** Add fields (codes, IDs) when callers need structure.
118. Don’t panic for normal failures  
   - **Hook:** "File not found — panic?"
   - **Core:** Return errors for expected failure; panic for programmer bugs.
119. Handle, transform, or return — don’t ignore  
   - **Hook:** "Is `_ = err` ever OK?"
   - **Core:** Almost never; at least log with reason at the boundary.
120. Error messages: actionable and lowercase  
   - **Hook:** "How should error strings look?"
   - **Core:** Usually lowercase, no punctuation fireworks; context via wrapping.
121. Wrap at boundaries, not every line  
   - **Hook:** "Should every function wrap?"
   - **Core:** Add context where it improves diagnosis — avoid noisy wrap spam.
122. Centralize error mapping in HTTP/API layers  
   - **Hook:** "Where do I turn errors into status codes?"
   - **Core:** Map domain errors to HTTP once at the edge.
123. Retryable vs fatal errors  
   - **Hook:** "Should I retry everything?"
   - **Core:** Classify errors; retries need idempotency and backoff.
124. Mini checklist: error handling  
   - **Hook:** "What does good err code look like?"
   - **Core:** checked, wrapped with `%w`, inspected via Is/As, never silently dropped.

---

## Module 9. Concurrency — goroutines and channels (125–144)

125. Goroutines are lightweight concurrency  
   - **Hook:** "Are goroutines OS threads?"
   - **Core:** Multiplexed green threads — cheap to start, still need discipline.
126. Starting a goroutine  
   - **Hook:** "How do I run code concurrently?"
   - **Core:** `go f()` — then plan lifecycle and error handling.
127. Channels as communication pipes  
   - **Hook:** "How do goroutines talk safely?"
   - **Core:** Channels send/receive values between goroutines.
128. Unbuffered vs buffered channels  
   - **Hook:** "Why does my send block forever?"
   - **Core:** Unbuffered needs a partner; buffers add capacity and different coupling.
129. `range` over channel  
   - **Hook:** "How do I consume until done?"
   - **Core:** Range until the channel is closed.
130. Closing channels — who owns close?  
   - **Hook:** "Who is allowed to close?"
   - **Core:** Sender owns close; never close if multiple senders without coordination.
131. Select multiplexing  
   - **Hook:** "How do I wait on multiple channels?"
   - **Core:** `select` chooses a ready case — core concurrency switchboard.
132. Timeouts with `time.After` / context  
   - **Hook:** "How do I stop waiting forever?"
   - **Core:** Select on work vs timeout/cancel signals.
133. Context basics (`context.Context`)  
   - **Hook:** "What is ctx doing in every API?"
   - **Core:** Carries deadlines/cancelation/values across call trees.
134. Context cancelation propagation  
   - **Hook:** "Why didn’t my background job stop?"
   - **Core:** Listen to `ctx.Done()` and return promptly.
135. Don’t put request-scoped data randomly in context  
   - **Hook:** "Is context a DI bag?"
   - **Core:** Optional values only; prefer explicit parameters for required deps.
136. WaitGroup for fan-out join  
   - **Hook:** "How do I wait for N workers?"
   - **Core:** `sync.WaitGroup` Add/Done/Wait — simple join pattern.
137. Mutex when shared memory is required  
   - **Hook:** "Channels always, right?"
   - **Core:** Share memory by communicating when natural; use `sync.Mutex` for state protection.
138. RWMutex read-heavy cases  
   - **Hook:** "All locks are the same?"
   - **Core:** `RWMutex` helps many readers/rare writers — measure first.
139. Atomic ops for simple counters  
   - **Hook:** "Mutex for a counter feels heavy"
   - **Core:** `sync/atomic` for simple numeric flags/counters.
140. Race detector  
   - **Hook:** "How do I find data races?"
   - **Core:** `go test -race` / `go run -race` — use it regularly.
141. Worker pool pattern  
   - **Hook:** "How do I limit concurrency?"
   - **Core:** Fixed workers + job channel prevents unbounded goroutine storms.
142. Errgroup for concurrent tasks with errors  
   - **Hook:** "WaitGroup but with errors?"
   - **Core:** `golang.org/x/sync/errgroup` cancels siblings on first failure.
143. Concurrency anti-pattern: leaking goroutines  
   - **Hook:** "Why does memory grow forever?"
   - **Core:** Every goroutine needs an exit path — cancel, close, or finish.
144. Mini checklist: safe concurrency  
   - **Hook:** "What’s the concurrency review list?"
   - **Core:** ownership of close, cancelation, no racy maps, race detector clean.

---

## Module 10. Standard library you will use daily (145–164)

145. `fmt` verbs you’ll actually need  
   - **Hook:** "Which verbs matter?"
   - **Core:** `%v %s %d %q %T %+v` cover most logging and debugging.
146. `strings` and `strconv`  
   - **Hook:** "Where do conversions live?"
   - **Core:** Parse/format numbers with `strconv`; manipulate text with `strings`.
147. `bytes` and buffers  
   - **Hook:** "String builder or bytes.Buffer?"
   - **Core:** Use builders/buffers for efficient concatenation.
148. `time` package essentials  
   - **Hook:** "How do I store timestamps?"
   - **Core:** Prefer `time.Time` + UTC; parse with known layouts.
149. `encoding/json` marshal/unmarshal  
   - **Hook:** "How do APIs encode JSON?"
   - **Core:** Struct tags + json package; watch `omitempty` and pointers.
150. JSON and unknown fields  
   - **Hook:** "Should I disallow mystery JSON?"
   - **Core:** `Decoder.DisallowUnknownFields` helps strict APIs.
151. `os` and files  
   - **Hook:** "How do I read a config file?"
   - **Core:** `os.ReadFile` / `os.Open` + defer close.
152. `path/filepath` portable paths  
   - **Hook:** "Why not concatenate with /?"
   - **Core:** Use `filepath` for OS-safe paths.
153. `io` copy and limit readers  
   - **Hook:** "How do I stream safely?"
   - **Core:** `io.Copy`, `io.LimitReader` protect resources.
154. `net/http` client basics  
   - **Hook:** "How do I call an API?"
   - **Core:** Prefer `&http.Client{Timeout: ...}` over bare `http.Get`.
155. `net/http` server basics  
   - **Hook:** "Can Go be my API server?"
   - **Core:** `http.Handler` / mux patterns are production-proven.
156. Middleware pattern with handlers  
   - **Hook:** "How do I add auth/logging once?"
   - **Core:** Wrap `http.Handler` to compose cross-cutting behavior.
157. `log/slog` structured logging  
   - **Hook:** "Println logging in prod?"
   - **Core:** Structured logs (slog) make querying and severity sane.
158. `regexp` carefully  
   - **Hook:** "Is regex always fine?"
   - **Core:** Compile once; avoid pathological patterns on hot paths.
159. `sort` and comparisons  
   - **Hook:** "How do I sort structs?"
   - **Core:** `sort.Slice` / cmp helpers keep ordering explicit.
160. `crypto/rand` for tokens  
   - **Hook:** "Is math/rand OK for secrets?"
   - **Core:** Use crypto/rand for security-sensitive randomness.
161. Environment config with `os.Getenv`  
   - **Hook:** "Where do secrets and config come from?"
   - **Core:** Env for 12-factor config; validate at startup.
162. Signal handling for graceful shutdown  
   - **Hook:** "How do I stop a server cleanly?"
   - **Core:** Listen for SIGINT/SIGTERM, cancel context, shutdown server.
163. Embed files with `embed`  
   - **Hook:** "How do I ship static assets in the binary?"
   - **Core:** `//go:embed` packs files into the binary.
164. Mini checklist: stdlib first  
   - **Hook:** "Should I reach for a framework?"
   - **Core:** Prefer stdlib until a library clearly earns its complexity.

---

## Module 11. Testing and quality (165–180)

165. `testing` package basics  
   - **Hook:** "How do I write a Go test?"
   - **Core:** `*_test.go` + `func TestXxx(t *testing.T)`.
166. Table-driven tests  
   - **Hook:** "How do Go engineers structure cases?"
   - **Core:** Slice of cases with name/in/out — easy to extend.
167. `t.Helper`, `t.Fatal` vs `t.Error`  
   - **Hook:** "When should the test stop?"
   - **Core:** Fatal aborts the test function; Error continues accumulating failures.
168. Subtests with `t.Run`  
   - **Hook:** "How do I isolate cases?"
   - **Core:** Named subtests give clearer failures and selective runs.
169. Fakes and stubs via interfaces  
   - **Hook:** "Do I need a mocking framework?"
   - **Core:** Hand-written fakes are often clearer in Go.
170. `httptest` for handlers  
   - **Hook:** "How do I test HTTP without a real port?"
   - **Core:** `httptest.NewRecorder` exercises handlers in-process.
171. Benchmarks with `testing.B`  
   - **Hook:** "How do I know if I made it faster?"
   - **Core:** `go test -bench` measures ns/op and allocations.
172. Fuzzing basics  
   - **Hook:** "Can Go find weird inputs for me?"
   - **Core:** Fuzz tests explore edge cases automatically.
173. Coverage reports  
   - **Hook:** "How much is tested?"
   - **Core:** `go test -cover` / `-coverprofile` — coverage is a guide, not a goal.
174. Race detector in CI  
   - **Hook:** "Why did prod race but tests pass?"
   - **Core:** Run `-race` in CI for packages with concurrency.
175. `testify` / assertions (optional)  
   - **Hook:** "Do I need assert libraries?"
   - **Core:** Std testing is enough; libraries reduce boilerplate if your team likes them.
176. Golden files carefully  
   - **Hook:** "Should I snapshot everything?"
   - **Core:** Useful for stable encodings; keep updates intentional.
177. Test package `foo_test` externally  
   - **Hook:** "Why test from another package?"
   - **Core:** External tests only use exported API — good integration check.
178. Build tags for integration tests  
   - **Hook:** "How do I skip slow tests locally?"
   - **Core:** Tags like `//go:build integration` gate heavy suites.
179. Linting with `staticcheck` / `golangci-lint`  
   - **Hook:** "Is vet enough forever?"
   - **Core:** Add linters as the project grows — catch more classes of bugs.
180. Mini checklist: testable Go code  
   - **Hook:** "What makes code easy to test?"
   - **Core:** small functions, interfaces at boundaries, table tests, race checks.

---

## Module 12. HTTP, APIs, and small services (181–194)

181. `http.ServeMux` routing  
   - **Hook:** "How do I map paths to handlers?"
   - **Core:** Register patterns on a mux; know Go 1.22+ method-aware patterns.
182. HandlerFunc and handlers  
   - **Hook:** "What is the smallest HTTP unit?"
   - **Core:** `func(w,r)` implements `http.Handler` via `HandlerFunc`.
183. Request parsing: query, path, body  
   - **Hook:** "Where do params live?"
   - **Core:** `r.URL.Query()`, path vars (router-dependent), `json.Decoder`.
184. Response writing and status codes  
   - **Hook:** "Why did the client get 200 on error?"
   - **Core:** Set status before body; map domain errors explicitly.
185. Middleware: logging request ID  
   - **Hook:** "How do I trace one request?"
   - **Core:** Generate/propagate request ID in middleware early.
186. Middleware: auth check  
   - **Hook:** "Where does auth belong?"
   - **Core:** Wrap protected routes; fail fast with 401/403.
187. Context in handlers  
   - **Hook:** "Why pass r.Context() down?"
   - **Core:** Request-scoped cancelation/deadlines propagate to DB/HTTP calls.
188. Graceful server shutdown  
   - **Hook:** "How do deploys avoid dropped requests?"
   - **Core:** `Server.Shutdown` with timeout after signal.
189. Health and readiness endpoints  
   - **Hook:** "What should /health return?"
   - **Core:** Liveness vs readiness — don’t conflate them.
190. Struct validation at the edge  
   - **Hook:** "Where do I validate JSON?"
   - **Core:** Decode, validate, then call domain logic — keep handlers thin.
191. Versioned API paths  
   - **Hook:** "How do I ship /v2 safely?"
   - **Core:** Prefix routes (`/v1`, `/v2`) and document breaking changes.
192. OpenAPI / Swagger (concept)  
   - **Hook:** "How do teams document HTTP APIs?"
   - **Core:** Spec-first or code-generated docs — pick one process.
193. Rate limiting basics  
   - **Hook:** "How do I protect a small API?"
   - **Core:** Token bucket per IP/key at the edge or middleware.
194. Mini checklist: small Go API  
   - **Hook:** "When is my API ‘good enough’ for prod?"
   - **Core:** timeouts, graceful shutdown, health checks, structured logs, error mapping.

---

## Module 13. Tooling, performance, and production habits (195–208)

195. `go install` for CLIs  
   - **Hook:** "How do I ship a command-line tool?"
   - **Core:** Build/install binaries with clear module path and version tags.
196. Cross-compilation with `GOOS` / `GOARCH`  
   - **Hook:** "Can I build for Linux from Windows?"
   - **Core:** Set env vars — Go cross-compiles easily.
197. `pprof` CPU and memory profiles  
   - **Hook:** "My service is slow — where?"
   - **Core:** Import `net/http/pprof` or use `go test -cpuprofile` to find hotspots.
198. Escape analysis (concept)  
   - **Hook:** "Why heap allocations matter?"
   - **Core:** `-gcflags=-m` shows escapes — reduce allocations on hot paths.
199. Preallocation with `make(..., cap)`  
   - **Hook:** "Why is append slow in a loop?"
   - **Core:** Pre-size slices when you know approximate length.
200. `sync.Pool` for reusable buffers  
   - **Hook:** "How do high-QPS services cut GC pressure?"
   - **Core:** Pool short-lived objects carefully — reset state on Get.
201. Configuration: flags + env  
   - **Hook:** "Where should config live?"
   - **Core:** `flag` for CLI, env for services — validate once at startup.
202. Twelve-factor habits in Go services  
   - **Hook:** "What makes a Go service deployable?"
   - **Core:** Config via env, logs to stdout, stateless processes, graceful shutdown.
203. Docker multi-stage builds for Go  
   - **Hook:** "How do I keep images tiny?"
   - **Core:** Build in one stage, copy static binary to minimal runtime image.
204. CI pipeline for Go  
   - **Hook:** "What should CI run every PR?"
   - **Core:** fmt/vet/test/race/build — fast feedback loop.
205. Semantic versioning for modules  
   - **Hook:** "When do I tag v1.2.3?"
   - **Core:** Tag releases; respect semver for downstream consumers.
206. Security: don’t log secrets  
   - **Hook:** "Is debug logging safe?"
   - **Core:** Redact tokens/passwords; structured logs still leak if careless.
207. Dependency updates with care  
   - **Hook:** "Should I always `go get -u` everything?"
   - **Core:** Update deliberately; read changelogs; run full test suite.
208. Mini checklist: production Go service  
   - **Hook:** "What do I verify before prod?"
   - **Core:** timeouts, cancelation, metrics/logs, health, graceful shutdown, pinned deps.

---

## Module 14. Generics, patterns, and interview prep (209–220)

209. Generics: when they help  
   - **Hook:** "Should I generic everything?"
   - **Core:** Use generics to remove real duplication — not for aesthetics.
210. Type parameters on functions  
   - **Hook:** "How do I write `Min[T]`?"
   - **Core:** Constraints like `cmp.Ordered` keep generics readable.
211. Generic slices helpers  
   - **Hook:** "Do I still need hand-rolled helpers?"
   - **Core:** Prefer std `slices`/`maps` packages when they fit.
212. Common interview: slices and maps  
   - **Hook:** "What gets asked on junior Go interviews?"
   - **Core:** nil vs empty, append sharing, map ok-idiom, iteration order.
213. Common interview: interfaces  
   - **Hook:** "Explain interfaces in 30 seconds"
   - **Core:** Implicit satisfaction, small interfaces, nil interface gotcha.
214. Common interview: errors  
   - **Hook:** "How does Go handle errors?"
   - **Core:** Values, wrapping with `%w`, `errors.Is`/`As`.
215. Common interview: concurrency  
   - **Hook:** "Goroutines vs threads?"
   - **Core:** Cheap goroutines, channels/select, context cancelation, race detector.
216. Common interview: HTTP server lifecycle  
   - **Hook:** "What happens on shutdown?"
   - **Core:** Signal → cancel → `Shutdown` → drain in-flight requests.
217. Myth roundup: dangerous Go shortcuts  
   - **Hook:** "Which beliefs hurt juniors?"
   - **Core:** panic for errors, goroutine leaks, ignoring err, giant interfaces, premature generics.
218. Mini project: CLI + JSON API  
   - **Hook:** "How do I lock in the course?"
   - **Core:** Build a small CLI that talks to a tiny HTTP API with tests and `-race`.
219. Mini project: worker pool  
   - **Hook:** "How do I practice concurrency?"
   - **Core:** Jobs channel, N workers, context cancel, errgroup, metrics.
220. What next after the course  
   - **Hook:** "Where do I go when shorts end?"
   - **Core:** Contribute to open source, read stdlib, build a real service, prep CKAD-adjacent tooling or backend interviews.

---

## Дополнение: шаблон для каждого шортса

- Хук (3–5 секунд): одна боль/вопрос  
- Суть (20–40 секунд): 1 концепт + 1 пример или команда  
- Закрепление (5–10 секунд): правило / beginner trap / phone-readable code insert  
- CTA (5 секунд): `Master Go faster. Theory, hands-on labs, and interview questions — link in bio.`

On-screen code rule:
- One short command, or 3–6 YAML/Go lines max  
- Huge font, high contrast — readable on a phone  
- No dense walls of code

---

## Как публиковать, чтобы досматривали

- Выпускай модулями (сериями), а не вразнобой  
- В конце каждого видео анонсируй следующий урок  
- Держи единый визуальный стиль и рубрикатор модуля  
- Повторяй ключевые команды на экране крупно  
- Делай 1–2 «диагностических» шортса на каждые 5 теоретических  
- Не прыгай через модули: why Go → setup → syntax → types → … → career  

Pipeline guide: `golang-shorts-pipeline-prompt.md`.
