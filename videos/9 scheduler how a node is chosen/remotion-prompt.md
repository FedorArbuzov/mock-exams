Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Scheduler - how a node is chosen

Style:
- Modern motion graphics.
- Dark background (#0B1020) with blue and cyan accents.
- Clean, minimal UI inspired by Kubernetes dashboards, kubectl output, and cluster diagrams.
- Smooth animations with subtle glow.
- Premium SaaS aesthetic (same series family as Go shorts).
- No stock footage or real people.
- Use simple vector icons and isometric illustrations (nodes, pods, services, control plane).
- Every animation should synchronize with the narration.
- Add animated captions with highlighted keywords.
- Duration should match the voice-over automatically.
- Persistent brand footer: keep `exallenge.tech` visible for the entire video — small, quiet type under the captions / lower safe area on every scene. No QR code.
- Scene 1 MUST show a large TopicBanner with the episode topic title so the viewer instantly knows what the reel is about.

Scene 1 (0:00)

Narration:

"Why did this Pod land on that specific node?"

Animation:

- TopicBanner: "Scheduler"
- Pending Pod hovers above a row of worker nodes.
- One node glows cyan as if selected.
- Question mark between Pod and chosen node.
- Highlight: "Pod", "node".

---

Scene 2

Narration:

"Because the scheduler chose it. After you apply a Pod with no nodeName set, it sits Pending until the scheduler filters all nodes by CPU, memory, taints, tolerations, affinities, and topology rules, then scores the survivors and picks one."

Animation:

- Pod badge: Pending.
- Scheduler brain icon scans nodes.
- Filter funnel removes nodes:
  - insufficient CPU
  - taint mismatch
  - affinity fail
- Scoring bars on remaining nodes.
- Winner node highlighted.
- Highlight: "Pending", "filters", "taints", "affinity", "scores".

---

Scene 3

Narration:

"The scheduler only assigns. It does not start containers. The kubelet on the winning node picks up the Pod and runs it."

Animation:

- Scheduler handoff: assignment arrow to Node 3 only.
- Explicit label: assigns only (no container start icon on scheduler).
- kubelet on Node 3 receives Pod and starts container.
- Highlight: "assigns", "kubelet", "runs".

---

Scene 4

Narration:

"What breaks: Pods stuck Pending usually mean no node fits. Maybe every node lacks memory, a required nodeSelector does not match, or a taint blocks scheduling. Beginners kubectl delete the Pod repeatedly, but the constraint never changed."

Animation:

- Pod stuck Pending with timer spinning.
- All nodes red with constraint icons: memory, nodeSelector, taint.
- Loop: delete Pod → new Pod → still Pending.
- Constraint badge stays unchanged.
- Highlight: "Pending", "nodeSelector", "taint", "constraint".

---

Scene 5

Narration:

"Practical check: kubectl describe pod and scroll to Events. You will see messages like Insufficient cpu or did not tolerate taint."

Animation:

- Large command: kubectl describe pod
- Events panel scrolls into view.
- Event lines appear:
  - 0/3 nodes available: Insufficient cpu
  - did not tolerate taint
- Highlight: "describe pod", "Events", "Insufficient cpu".

---

Scene 6

Narration:

"Rule to remember: Pending without a nodeName means ask the scheduler, not the kubelet."

Animation:

- Decision tree:
  - Pending + no nodeName → Scheduler
  - Assigned + not Running → kubelet
- Zoom out to CTA card.

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
- EXALLENGE logo fades in beneath the CTA.
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
  - Scheduler
  - Pending
  - taints
  - affinity
  - nodeSelector
  - Events
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003.
