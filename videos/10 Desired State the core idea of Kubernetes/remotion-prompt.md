Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Desired State - the core idea of Kubernetes

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

"Why does Kubernetes fix drift by itself?"

Animation:

- TopicBanner: "Desired State"
- Three Pod icons in a row (target state).
- One Pod vanishes; a replacement Pod materializes automatically.
- Drift arrow snaps back to aligned state.
- Highlight: "drift", "fix".

---

Scene 2

Narration:

"Because you declare desired state, and controllers continuously reconcile reality to match. You write a Deployment with replicas equals 3. Kubernetes stores that target. If a Pod crashes, the ReplicaSet controller notices only two Running and creates a replacement. You changed nothing manually."

Animation:

- Large YAML snippet (max 4 lines, big type):
  - kind: Deployment
  - replicas: 3
- Three Running Pods shown.
- One Pod crashes (red X).
- Counter drops to 2 Running.
- ReplicaSet controller loop icon spins.
- New Pod created; counter back to 3.
- Highlight: "replicas equals 3", "controller", "replacement".

---

Scene 3

Narration:

"That loop is the core idea. You describe the end state in YAML. Watchers compare etcd to the world. Anything missing gets created. Anything extra gets cleaned up."

Animation:

- Reconciliation loop diagram:
  - YAML desired state
  - etcd record
  - compare to actual world
  - create missing / delete extra
- Continuous circular animation.
- Highlight: "YAML", "etcd", "reconcile", "end state".

---

Scene 4

Narration:

"What breaks: imperative kubectl run and manual edits fight the declarative model. You scale up by hand, a controller scales back down, and you think Kubernetes is broken. Beginners treat YAML as documentation instead of the contract."

Animation:

- Split paths:
  - Declarative: kubectl apply YAML (green path)
  - Imperative: kubectl run / manual scale (red path)
- Manual scale up → controller scale down tug-of-war.
- YAML file labeled Documentation gets stamped CONTRACT.
- Highlight: "imperative", "declarative", "contract".

---

Scene 5

Narration:

"Practical check: kubectl get deployment and kubectl get pods. Count Running Pods against desired replicas before editing the manifest again."

Animation:

- Commands side by side:
  - kubectl get deployment
  - kubectl get pods
- Deployment shows desired replicas: 3
- Pod list count: 3 Running (or mismatch highlighted in red).
- Highlight: "get deployment", "get pods", "replicas".

---

Scene 6

Narration:

"Rule to remember: declare the end state. Let controllers fight drift for you."

Animation:

- Rule card:
  - Declare the end state
  - Controllers fight drift
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
  - Desired State
  - replicas
  - controllers
  - reconcile
  - drift
  - YAML
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003.
