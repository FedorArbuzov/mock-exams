Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Container vs Pod

Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents.
- Clean, minimal UI inspired by Kubernetes dashboards.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic.
- No stock footage or real people.
- Use simple vector icons and isometric illustrations.
- Every animation should synchronize with the narration.
- Add animated captions with highlighted keywords.
- Duration should match the voice-over automatically.
- Persistent brand footer: keep `exallenge.tech` visible for the entire video — small, quiet type under the captions / lower safe area on every scene. No QR code.

Scene 1 (0:00)

Narration:

"Why does Kubernetes say Pod instead of just container?"

Animation:

- Center title split: left shows a Docker-style container icon labeled "Container", right shows a Pod hexagon labeled "Pod".
- A glowing question mark pulses between them.
- Cross out the idea of scheduling a bare container: a faint red slash appears over a lone container.
- Highlight the words "Pod" and "container".
- Slow camera zoom into the Pod shape.

---

Scene 2

Narration:

"Because Kubernetes does not schedule containers directly. It schedules Pods. A Pod is the smallest deployable unit: one IP, one shared network namespace, and optional shared volumes."

Animation:

- Show a scheduler arrow rejecting a lone container, then accepting a Pod.
- Pod expands into a clear diagram:
  - one IP badge
  - shared network ring
  - optional shared volume block beneath
- One or two containers appear inside the Pod boundary.
- Labels fade in one by one: "1 IP", "Shared network", "Shared volumes".
- Highlight: "Pods", "smallest deployable unit", "IP", "network", "volumes".

---

Scene 3

Narration:

"Most Pods run a single container. That is normal. Multi-container Pods exist when helpers must share fate with the app: a log sidecar, a proxy, or an init-style companion that needs the same localhost and disk."

Animation:

- First: a clean single-container Pod with a green check and label "Most common".
- Then morph into a multi-container Pod:
  - main app container in the center
  - log sidecar slides in beside it
  - proxy appears as a thin edge companion
  - init-style companion flashes briefly before the main app starts
- Animate localhost traffic as a short loop between app and sidecar.
- Shared disk icon lights up between them.
- Highlight: "single container", "sidecar", "proxy", "localhost".

---

Scene 4

Narration:

"Practical rule: one Pod equals one colocated unit of work. If two processes must share localhost ports or a local volume, they belong in one Pod. If they scale independently, they should be separate Pods behind separate Deployments."

Animation:

- Split screen decision tree:
  - Left path: "Need shared localhost / volume?" → one Pod with two containers.
  - Right path: "Scale independently?" → two Pods, each with one container, under two Deployment cards.
- Animate scaling: independent Pods multiply separately; colocated containers stay glued inside one Pod.
- Soft green check on the correct path as narration lands each rule.
- Highlight: "one Pod", "localhost", "volume", "Deployments".

---

Scene 5

Narration:

"When someone says the container restarted, ask: which Pod, which container inside it, and who owns that Pod?"

Animation:

- Chat-style callout: "the container restarted".
- Three diagnostic questions appear as stacked cards:
  1. Which Pod?
  2. Which container inside it?
  3. Who owns that Pod?
- Zoom into a Pod with two containers; one container flashes restart while the Pod and owner Deployment stay labeled.
- Ownership arrow from Deployment → ReplicaSet → Pod becomes visible.
- Highlight: "Pod", "container", "owns".

---

Scene 6

Narration:

"Master Kubernetes faster. Theory, hands-on labs, and interview questions — link in bio."

Animation:

- Camera slowly zooms out.
- Display a premium CTA card.

Headline:

Master Kubernetes Faster

Subtitle:

Theory • Hands-on Labs • Interview Questions

Footer:

Link in Bio

Domain (small, pinned under the footer text):

exallenge.tech

- Animated arrow points upward.
- CTA softly pulses.
- Background particles continue floating.
- End with the EXALLENGE logo fading in beneath the CTA.
- Under "Link in Bio", keep showing `exallenge.tech` in the same small footer style used throughout the reel — pinned, not competing with the headline.
- No QR code.

---

General Requirements

- Use smooth easing.
- Maintain visual consistency across all scenes.
- Avoid clutter.
- Keep animations simple, educational, and premium.
- Synchronize every scene with the voice-over timing.
- Animate captions word-by-word.
- Highlight important words such as:
  - Kubernetes
  - Pod
  - Container
  - Containers
  - IP
  - Network
  - Volumes
  - Sidecar
  - localhost
  - Deployment
  - Deployments
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions (lower third / safe area). Same style in every scene; do not hide it between cuts.
- Export in 1080x1920 at 30 FPS.
- The overall visual style should resemble educational animations from ByteByteGo or Fireship with a premium SaaS aesthetic.
- Match series look from episode 1 (same colors, caption style, CTA, brand footer).
