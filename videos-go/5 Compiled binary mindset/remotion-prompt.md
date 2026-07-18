Create a 9:16 vertical animated explainer video for Instagram Reels.

Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents.
- Clean, minimal UI inspired by terminals, Go toolchain output, and IDE panels.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic (same series family as Kubernetes shorts).
- No stock footage or real people.
- Use simple vector icons and isometric illustrations.
- Every animation should synchronize with the narration.
- Add animated captions with highlighted keywords.
- Duration should match the voice-over automatically.
- Persistent brand footer: keep `exallenge.tech` visible for the entire video — small, quiet type under the captions / lower safe area on every scene. No QR code.

**IMPORTANT — no text duplication:** The animated caption at the bottom already shows the full narration sentence. Do NOT put a second copy of that sentence (or a close paraphrase) as a big on-screen headline. Any on-screen text besides the caption must be a short 1-4 word label.

---

Scene 1 (0:00)

Narration:

"Where is my virtualenv for Go?"

Concept: "A search that comes up empty, then finds something else instead."

Animation:

- A folder icon sits center frame. A magnifying glass sweeps across it and around it, searching.
- No "venv" folder appears — after the search, the magnifying glass settles and a small `go.mod` file icon fades in next to the folder instead.
- No narration-echoing headline; the search-then-substitution motion tells the story.

---

Scene 2

Narration:

"There is not one — and that is the point. Go modules track dependencies in go.mod, but the artifact you ship is a compiled binary. Run go build, copy one file to the server, done."

Concept: "Terminal builds, then the binary is visibly dragged onto a server."

Animation:

- Terminal types `$ go build`.
- A single binary icon pops out and is dragged (an explicit motion path, not a fade) onto a server icon positioned lower on the frame.
- On arrival, a small checkmark flashes next to the server — "done".
- Use the full vertical travel distance between terminal and server; this is a deliberate long trip, not empty space.

---

Scene 3

Narration:

"That changes how you think about deploys. No 'works on my machine' Python version mismatch. No JVM tuning on every host. The binary bundles your code; the OS runs it."

Concept: "Two crossed-out tags fall away from a solid binary."

Animation:

- A binary icon sits mid-frame, steady and glowing.
- Two tags drift away from it and get struck through as they fade: "python version mismatch", "JVM tuning per host" — visualizing things the binary makes irrelevant.
- Beneath, a small label settles: "OS runs it" (short, factual, not a narration repeat).

---

Scene 4

Narration:

"Tradeoff: you compile per target OS and architecture when cross-building. But GOOS and GOARCH make that straightforward."

Concept: "One binary fans out into three target-specific binaries."

Animation:

- A single binary icon splits into three smaller binary icons that slide outward into a row.
- Each gets a small platform tag beneath it: "linux/amd64", "darwin/arm64", "windows/amd64".
- The fan-out motion itself communicates "compile per target"; keep the row centered with even spacing so it reads as a deliberate build matrix, not clutter.

---

Scene 5

Narration:

"Mental model: Go is compile once, ship a binary, run anywhere compatible — not install a runtime stack first."

Concept: "A 3-step horizontal flow: compile → ship → run."

Animation:

- Three icons connected left to right: a terminal (compile), a binary (ship), and a small cluster of generic device/server icons (run anywhere).
- Each step lights up in sequence as a connecting line draws between them.
- Label under each icon: "compile", "ship", "run" — one word each.

---

Scene 6

Narration:

"Master Go faster. Theory, hands-on labs, and interview questions — link in bio."

Animation: standard CTA card (shared template) — headline "Master Go Faster", subtitle "Theory • Hands-on Labs • Interview Questions", "Link in Bio", `exallenge.tech`, EXALLENGE mark fade-in, upward arrow, drifting particles, camera zoom-out. No QR code.

---

General Requirements

- Use smooth easing.
- Use the full 1080×1920 frame — spread content across upper, middle, and lower thirds.
- Keep animations simple, educational, and premium.
- Synchronize every scene with the voice-over timing.
- Animate captions word-by-word; highlight: Go, go.mod, binary, JVM, GOOS, GOARCH, Link in Bio.
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer.
- Export in 1080x1920 at 30 FPS.
- Overall look: ByteByteGo / Fireship-style premium SaaS motion graphics, same series family as the Kubernetes shorts, with Go-specific icons.
