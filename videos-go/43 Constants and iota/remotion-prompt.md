Create a 9:16 vertical animated explainer video for Instagram Reels.

Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents.
- Clean, minimal UI inspired by terminals, Go toolchain output, and IDE panels.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic (same series family as Kubernetes shorts).
- No stock footage or real people.
- Use simple vector icons and isometric illustrations (packages, goroutines, structs, channels).
- Every animation should synchronize with the narration.
- Add animated captions with highlighted keywords.
- Duration should match the voice-over automatically.
- Persistent brand footer: keep `exallenge.tech` visible for the entire video — small, quiet type under the captions / lower safe area on every scene. No QR code.

**IMPORTANT — no text duplication:** The animated caption at the bottom already shows the full narration sentence. Do NOT put a second copy of that sentence (or a close paraphrase) as a big on-screen headline. Any on-screen text besides the caption must be a short label of 1-4 words that names what's being shown (e.g. "iota", "type Status int") — never a restatement of the narrator's sentence. Let the visual metaphor carry the meaning.

---

Scene 1 (0:00)

Narration:

"How do enums work in Go?"

Concept: "Enums without classes."

Animation:

- Center panel with a glowing question mark and a small numbered list icon (1, 2, 3 chips) representing enum members.
- Pulse rings behind the icon.
- Short label under icon: "enums?"

---

Scene 2

Narration:

"With typed constants and iota. A const block — StatusPending equals iota, then StatusActive, StatusDone — gives readable names and integer values without a class hierarchy."

Concept: "Const block fills in."

Animation:

- Phone-readable code panel (large mono, ≤6 lines):
  type Status int
  const (
    StatusPending = iota  // 0
    StatusActive          // 1
    StatusDone            // 2
  )
- Lines cascade in top→bottom with cyan highlight on `iota`.
- Small label: "iota = 0,1,2"

---

Scene 3

Narration:

"iota resets per const block and increments each line. Combine it with an explicit type: type Status int. Now your constants are Status values, not bare ints mixed everywhere."

Concept: "Reset + typed constants."

Animation:

- Left: counter chip "iota" counting 0→1→2, then a flash "reset" on a new block.
- Right: badge "type Status int" locks in with a checkmark.
- Arrow from bare `int` crossed out → `Status`.
- Short labels only: "resets", "typed"

---

Scene 4

Narration:

"This is the idiomatic Go enum — simple, compile-time, and easy to stringify in a switch or a String method."

Concept: "Three wins."

Animation:

- Three tiles slide in: "simple", "compile-time", "String()".
- Green check appears on each as it settles.
- Optional tiny switch snippet (2–3 lines max) fades under the tiles.

---

Scene 5

Narration:

"Pattern: type Status int, a const block with iota, then String or switch for display."

Concept: "Checklist pattern."

Animation:

- Vertical checklist of three steps with checkmarks:
  1. type Status int
  2. const + iota
  3. String / switch
- Steps reveal one by one.

---

Scene 6 — CTA

Narration:

"Master Go faster. Theory, hands-on labs, and interview questions — link in bio."

Animation:

- Standard CTA card:
  - Headline: `Master Go Faster`
  - Subtitle: `Theory • Hands-on Labs • Interview Questions`
  - Footer: `Link in Bio`
  - Domain under footer: `exallenge.tech`
  - EXALLENGE logo fade-in
  - No QR code

---

Export: 1080×1920 @ 30 FPS. Composition id: `golang-043-constants-and-iota`.
