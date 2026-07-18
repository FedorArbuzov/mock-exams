Create a 9:16 vertical animated explainer video for Instagram Reels.

Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents; Python side uses an amber (#FBBF24) accent for contrast.
- Clean, minimal UI inspired by terminals, Go toolchain output, and IDE panels.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic (same series family as Kubernetes shorts).
- No stock footage or real people.
- Use simple vector icons and isometric illustrations (packages, goroutines, structs, channels).
- Every animation should synchronize with the narration.
- Add animated captions with highlighted keywords.
- Duration should match the voice-over automatically.
- Persistent brand footer: keep `exallenge.tech` visible for the entire video — small, quiet type under the captions / lower safe area on every scene. No QR code.

**IMPORTANT — no text duplication:** The animated caption at the bottom already shows the full narration sentence. Do NOT put a second copy of that sentence (or a close paraphrase) as a big on-screen headline. "Python" and "Go" as language badge labels are fine — but no sentence-length text besides the caption. Any other on-screen text must be a short 1-4 word label.

---

Scene 1 (0:00)

Narration:

"I know Python — why switch?"

Concept: "A rivalry intro, not a static VS label."

Animation:

- Frame splits into two halves: left half washed in a soft amber glow with a "Python" badge, right half in cyan glow with a "Go" badge.
- The two halves gently push against each other toward the center (like two boxers touching gloves) and a small spark/flash animates where they meet, replacing a flat "VS" text with an actual collision moment.
- No headline text — the visual tension of the two glows meeting carries the "why switch" question.

---

Scene 2

Narration:

"Python wins when you need speed of experimentation: notebooks, data pipelines, quick CRUD with Django or FastAPI. Go wins when you need predictable performance, static types, and a concurrency model that does not fight you at scale."

Concept: "Two columns, each with its own icon identity, not just badges with bullet lists."

Animation:

- Left column headed by a notebook icon + "Python" badge; tags drop in beneath it one at a time: "notebooks", "data pipelines", "quick CRUD".
- Right column headed by a speedometer/gauge icon + "Go" badge; tags drop in beneath it: "predictable performance", "static types", "concurrency at scale".
- Columns fill the middle two-thirds of the frame vertically (icon near top of each column, tags cascading downward), not clustered high with empty space below.

---

Scene 3

Narration:

"In Python, a typo might surface at runtime. In Go, many bugs fail at compile time. In Python, scaling often means more processes and careful async. In Go, goroutines and channels are first-class."

Concept: "Two terminals with a timeline bar showing WHEN each one fails."

Animation:

- Top panel (amber accent): Python terminal runs `$ python app.py`, shows "Running..." for a beat, then fails mid-run with `NameError: usr is not defined`. A thin timeline bar under this panel shows a red mark partway along a "runtime" segment — the failure happens after execution started.
- Bottom panel (cyan accent): Go terminal runs `$ go build`, fails immediately with `undefined: usr` / `build failed` — it never reaches a "running" state at all. Its timeline bar shows the red mark right at the start, before a "run" segment even begins (the run segment stays greyed out/unreached).
- The side-by-side timeline bars are the key visual: same bug, different moment of failure.

---

Scene 4

Narration:

"You do not have to abandon Python. But for long-running APIs and infra tools, Go reduces operational weight."

Concept: "Two tools in one toolbox — not a war, a kit."

Animation:

- A single toolbox icon opens in the center of the frame.
- A Python tool icon and a Go tool icon slide into the toolbox side by side and settle in — both belong here, neither is discarded.
- Once both are in place, a small weight/gauge icon appears near the Go tool tilting toward "lighter" (visualizing "reduces operational weight") — attached specifically to the Go tool, not a generic label floating on its own.

---

Scene 5

Narration:

"Rule of thumb: prototype in Python if the domain fits; ship core services in Go when reliability and deploy simplicity matter."

Concept: "Sketch to shipped — a build-up, not two static badges."

Animation:

- Left: a pencil-and-notebook icon labeled "prototype" (Python amber accent).
- An arrow animates left-to-right as the sketch icon visually "resolves" into something more solid.
- Right: a server/rocket icon labeled "ship" (Go cyan accent), arriving with a small glow as the arrow completes — visualizing the idea-to-production journey rather than two disconnected badges.

---

Scene 6

Narration:

"Master Go faster. Theory, hands-on labs, and interview questions — link in bio."

Animation: standard CTA card (unchanged from the shared template) — headline "Master Go Faster", subtitle "Theory • Hands-on Labs • Interview Questions", "Link in Bio", `exallenge.tech`, EXALLENGE mark fade-in, upward arrow, drifting particles, camera zoom-out. No QR code.

---

General Requirements

- Use smooth easing.
- Maintain visual consistency across all scenes, but keep each scene's layout distinct — no repeated "badge + list" template across the whole episode.
- Avoid clutter, but also avoid dead space — use the full 1080×1920 frame.
- Keep animations simple, educational, and premium.
- Synchronize every scene with the voice-over timing.
- Animate captions word-by-word; highlight: Go, Python, static types, concurrency, goroutines, channels, compile time, runtime, Link in Bio.
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer (lower safe area). Same style every scene.
- Export in 1080x1920 at 30 FPS.
- Overall look: ByteByteGo / Fireship-style premium SaaS motion graphics, same series family as the Kubernetes shorts, with Go-specific icons.
