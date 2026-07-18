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

**IMPORTANT — no text duplication:** The animated caption at the bottom already shows the full narration sentence. Do NOT put a second copy of that sentence (or a close paraphrase) as a big on-screen headline. Company names may appear as plain text on generic tiles (factual, not a logo) — but no sentence-length text besides the caption. Any other on-screen text must be a short 1-4 word label that names what's being shown.

---

Scene 1 (0:00)

Narration:

"Is Go only for Google?"

Concept: "One giant name shrinks into a crowd."

Animation:

- A single oversized generic tile labeled "Google" sits alone, centered, dominating the frame.
- It shrinks and steps back as a wider grid of many smaller, unlabeled generic tiles fades in around and behind it — visually "there's a whole crowd here, not just one."
- Once the grid settles, a small tag appears: "+ many more" (new information, not a restatement of the question).
- Use the full vertical frame for the grid expansion, not just the top third.

---

Scene 2

Narration:

"No. Uber, Cloudflare, Dropbox, and Twitch all run Go in production, alongside countless smaller platform teams — not as an experiment, but as the default choice for services that must stay up."

Concept: "A live status page, not a marketing wall."

Animation:

- A small heading settles at the top: "status: live" (a status-page framing device, distinct from the narration).
- Below it, a vertical list of 4 rows — Uber, Cloudflare, Dropbox, Twitch — each with a green "Operational" pill that lights up one at a time, top to bottom, like a real uptime dashboard loading.
- Keep the list vertically centered in the frame with enough row height that it doesn't feel cramped at the top.

---

Scene 3

Narration:

"Go compiles in seconds, ships a single static binary, and gives you goroutines without a heavyweight runtime. That means faster CI, dead-simple deploys, and no surprise dependency conflicts at 3 a.m."

Concept: "A pipeline race that finishes before a clock can even strike 3 a.m."

Animation:

- Top half: three pipeline-stage icons — build, test, deploy — light up in rapid succession as a thin progress bar races across underneath them. Make the pace feel genuinely fast (quick, snappy transitions, not lingering).
- Bottom half: a clock face shows 3:00, a small crescent-moon icon next to it, and a bell icon with a slash through it (no alerts). This is a separate visual beat from the pipeline, not squeezed into the same cluster — give it its own space in the lower third.
- No sentence-length text; the clock + crossed bell communicate "nobody gets paged" on their own.

---

Scene 4

Narration:

"In an interview, this shows up as a concrete signal: can you explain a goroutine leak, or why a service restarts cleanly after a crash? That is what a hiring manager is actually screening for."

Concept: "A labeled 3-step flow diagram, not an abstract particle cloud."

Animation:

- Three connected boxes across the middle of the frame, left to right, each with a 1-word label under it: "spawn" → "no cleanup" → "leak". Small icons: a goroutine spawning (a dot popping out), a broken/missing cleanup icon, then the final box glows red as a warning.
- Boxes light up in sequence as the arrows between them draw in.
- Below the diagram, in the lower third, a separate small card: a chat-bubble icon with a question mark — representing "this gets asked in interviews" — clearly a second, distinct visual beat from the leak diagram above it, not overlapping or blended together.

---

Scene 5

Narration:

"Learn Go if you want to build services that ship as one binary and handle real concurrency without drama."

Concept: "One binary, clearly labeled goroutines orbiting it."

Animation:

- A single glowing binary icon sits center-frame with a small label beneath it: "1 binary".
- Small dots orbit around it in a steady ring; a small label sits just outside the ring: "goroutines" — so the metaphor reads immediately instead of relying on unlabeled motion.
- Keep the orbit large enough to use the middle third of the frame, not a tiny cluster.

---

Scene 6

Narration:

"Master Go faster. Theory, hands-on labs, and interview questions — link in bio."

Animation: standard CTA card (unchanged from the shared template) — headline "Master Go Faster", subtitle "Theory • Hands-on Labs • Interview Questions", "Link in Bio", `exallenge.tech`, EXALLENGE mark fade-in, upward arrow, drifting particles, camera zoom-out. No QR code.

---

General Requirements

- Use smooth easing.
- Maintain visual consistency across all scenes, but make sure Scene 2's status-list and Scene 3's pipeline-race read as distinct layouts from each other and from episode 1's badge wall — no repeated template look.
- Avoid clutter, but also avoid dead space — use the full 1080×1920 frame.
- Keep animations simple, educational, and premium.
- Synchronize every scene with the voice-over timing.
- Animate captions word-by-word; highlight: Go, Uber, Cloudflare, Dropbox, Twitch, goroutines, goroutine leak, Link in Bio.
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer (lower safe area). Same style every scene.
- Export in 1080x1920 at 30 FPS.
- Overall look: ByteByteGo / Fireship-style premium SaaS motion graphics, same series family as the Kubernetes shorts, with Go-specific icons.
