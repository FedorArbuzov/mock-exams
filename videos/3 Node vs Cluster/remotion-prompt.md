Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Node vs Cluster

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

"Are node and cluster the same thing?"

Animation:

- Split title in the center: left card "Node", right card "Cluster".
- A glowing equals sign appears between them, then flips into a red "≠".
- Subtle zoom into the two cards.
- Highlight: "node", "cluster".

---

Scene 2

Narration:

"No. A node is one worker machine: virtual machine or bare metal, with CPU, memory, disk, and a kubelet agent. A cluster is many nodes plus a control plane that treats them as one system."

Animation:

- Left: single server rack / machine icon labeled Node.
  - Badges fade in: CPU, Memory, Disk, kubelet.
- Right: multiple nodes appear and group under a Control Plane brain/header.
- Dashed lines connect Control Plane to each node.
- Label appears: "one system".
- Highlight: "worker machine", "kubelet", "control plane".

---

Scene 3

Narration:

"Your containers do not run on Kubernetes in the abstract. They run on a specific node. The cluster is the pool of capacity and the policy layer that decides placement, networking, and recovery."

Animation:

- A Pod descends from a "Kubernetes" label toward one concrete node highlighted in cyan.
- Other nodes stay dim.
- Overlay labels around the cluster:
  - Capacity pool
  - Placement
  - Networking
  - Recovery
- Animate a small scheduler arrow choosing the highlighted node.
- Highlight: "specific node", "capacity", "placement", "recovery".

---

Scene 4

Narration:

"If one node fails, the cluster can still be healthy. If the control plane fails, workers may keep running old workloads, but you lose the ability to change desired state safely."

Animation:

- Scenario A: one node turns red and drops; remaining nodes stay green; cluster health stays OK.
- Scenario B: control plane turns red; worker nodes keep running existing Pods, but apply/deploy actions get a red block icon.
- Caption chips: "node fail ≠ cluster dead" then "control plane down = no safe changes".
- Highlight: "node fails", "control plane", "desired state".

---

Scene 5

Narration:

"Beginner mental model: node equals capacity. Cluster equals orchestration. Always ask both: is the app broken, or is the node under pressure?"

Animation:

- Two clean equations appear:
  - Node = Capacity
  - Cluster = Orchestration
- Then a diagnostic checklist with two branches:
  - App broken?
  - Node under pressure?
- CPU/memory pressure bars rise on a node while an app Pod flashes separately.
- Soft checkmarks reinforce the dual-question habit.
- Highlight: "capacity", "orchestration", "app", "pressure".

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
  - Node
  - Cluster
  - kubelet
  - Control Plane
  - Capacity
  - Placement
  - Networking
  - Recovery
  - Orchestration
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions (lower third / safe area). Same style in every scene; do not hide it between cuts.
- Export in 1080x1920 at 30 FPS.
- The overall visual style should resemble educational animations from ByteByteGo or Fireship with a premium SaaS aesthetic.
- Match series look from episode 1 (same colors, caption style, CTA, brand footer).
