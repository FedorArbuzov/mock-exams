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

**IMPORTANT — no text duplication:** The animated caption at the bottom already shows the full narration sentence. Do NOT put a second copy of that sentence (or a close paraphrase) as a big on-screen headline. Any on-screen text besides the caption must be a short label of 1-4 words that names what's being shown (e.g. "Built with Go", "1 file → server") — never a restatement of the narrator's sentence. Let the visual metaphor carry the meaning.

---

Scene 1 (0:00)

Narration:

"Another language — why should I care about Go?"

Concept: "Singled out from the pile."

Animation:

- Top third: 5-6 small generic language chips (plain colored rounded squares — no real logos, no trademarks) drift in and float loosely, like a messy pile of "yet another option."
- One chip is the Go mark. Over the scene it separates from the pile, drifts to the vertical center, grows larger, and gains a cyan glow while the other chips dim and drift toward the edges/out of focus.
- Small label fades in under the mark once it's centered: "Go" (just the wordmark, not a sentence).
- Use the full frame height: pile starts high, Go mark's landing position is true center, not clustered at the top.

---

Scene 2

Narration:

"Go is a compiled language built for backend services, CLIs, and infrastructure tooling. You write straightforward code, run go build, and ship a single binary. No JVM, no interpreter on the server, no dependency drama at deploy time."

Concept: "One file travels from your terminal to the server — and that's it."

Animation:

- Top third: terminal window types `$ go build`.
- On completion, a single glowing binary icon ejects from the terminal and travels downward across the frame (a real transit animation, not an instant cut) toward a small server icon placed in the lower third.
- As the binary arrives at the server, three small tags pop up beside the server — "JVM", "interpreter", "extra deps" — and are immediately struck through / dissolve into particles, showing the server needs none of them.
- Small label near the server once it lands: "1 file → server".
- Fill the vertical space with the transit path so the eye travels top → bottom with the binary, instead of everything sitting in the top half.

---

Scene 3

Narration:

"Teams pick Go when they want fast builds, readable concurrency, and a strong standard library. Kubernetes, Docker, Terraform, and countless APIs are written in Go — not because it is trendy, but because it stays boring in production."

Concept: "A trusted-by badge wall, like a landing page social-proof strip."

Animation:

- A horizontal row of tiles labeled Kubernetes, Docker, Terraform, APIs slides in — alternating tiles from the left and right — and clicks into place with a small snap/settle motion (not a uniform fade-in-place for all of them).
- Each tile gets a small steady green dot once it locks in (quietly "in production", not a flashy pulse).
- A small stamp-style badge animates in above the row: "BUILT WITH GO" (short, all-caps, like a certification stamp — a new framing device, not a narration paraphrase).
- Center the badge wall vertically in the frame; don't leave the lower two-thirds empty.

---

Scene 4

Narration:

"Beginner mental model: Go is not a research language. It is a tool for shipping reliable network software with a small team vocabulary."

Concept: "Split contrast: research vs. production."

Animation:

- Frame splits into two vertical halves.
- Left half: a flask/beaker icon over a tangled, crossed-out diagram, desaturated. Small label: "research". A red X settles over it.
- Right half: the Go mark over a clean, simple network diagram (a few connected nodes, straight glowing lines). Small label: "production". A green check settles over it.
- After the contrast lands, the split collapses and 3-4 small tags cluster around the Go mark — "clear names", "errors", "structs" — as the concrete answer to "small team vocabulary" (a few real Go concepts, not the abstract word "vocabulary" repeated).

---

Scene 5

Narration:

"Master Go faster. Theory, hands-on labs, and interview questions — link in bio."

Animation: standard CTA card (unchanged from the shared template) — headline "Master Go Faster", subtitle "Theory • Hands-on Labs • Interview Questions", "Link in Bio", `exallenge.tech`, EXALLENGE mark fade-in, upward arrow, drifting particles, camera zoom-out. No QR code.

---

General Requirements

- Use smooth easing.
- Maintain visual consistency across all scenes.
- Avoid clutter, but also avoid dead space — use the full 1080×1920 frame; don't cluster everything in the top third.
- Keep animations simple, educational, and premium.
- Synchronize every scene with the voice-over timing.
- Animate captions word-by-word; highlight: Go, compiled, go build, binary, JVM, interpreter, Kubernetes, Docker, Terraform, Link in Bio.
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer (lower safe area). Same style every scene.
- Export in 1080x1920 at 30 FPS.
- Overall look: ByteByteGo / Fireship-style premium SaaS motion graphics, same series family as the Kubernetes shorts, with Go-specific icons.
