Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Control Plane in plain words

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

"Who makes decisions in a Kubernetes cluster?"

Animation:

- TopicBanner: "Control Plane"
- A glowing brain icon labeled Control Plane appears center.
- Worker nodes dim below as a question mark pulses.
- Highlight: "decisions", "cluster".

---

Scene 2

Narration:

"The control plane is the brain. It includes the API server as the front door, etcd storing cluster state, the scheduler placing new Pods, and controllers like the Deployment controller keeping replica counts right. Worker nodes are the muscle: they run containers but do not set cluster-wide policy."

Animation:

- Control plane stack builds top-down:
  - API server (front door icon)
  - etcd (database cylinder)
  - scheduler (arrow picking nodes)
  - controllers (loop icon, Deployment badge)
- Below: worker nodes labeled Muscle with running Pods.
- Dashed line separates brain from muscle.
- Highlight: "API server", "etcd", "scheduler", "controllers", "worker nodes".

---

Scene 3

Narration:

"When the control plane is healthy, you apply YAML and these parts cooperate. The API server validates your request, etcd persists it, controllers notice the change, and instructions reach nodes through each kubelet."

Animation:

- Flow diagram left to right:
  - kubectl apply arrow
  - API server validates (green check)
  - etcd write flash
  - controller reacts
  - kubelet on node receives instruction
- Small YAML card: kind Deployment (2 lines max, large type).
- Highlight: "apply", "validates", "etcd", "kubelet".

---

Scene 4

Narration:

"What breaks: control plane failure is different from a broken app. Workers may keep running existing Pods, but kubectl apply fails and new work cannot schedule safely. Beginners say 'Kubernetes is down' when they actually lost the brain, not a single Pod."

Animation:

- Split screen:
  - Left: control plane red, kubectl apply blocked
  - Right: worker nodes still green with old Pods running
- A beginner speech bubble: "Kubernetes is down" gets crossed out.
- Replace with labels: "brain lost" vs "one Pod broken".
- Highlight: "control plane", "kubectl apply", "brain".

---

Scene 5

Narration:

"Quick check: run kubectl get nodes. If nodes look Ready but apply keeps failing, inspect control plane Pods in kube-system before debugging application logs."

Animation:

- Large phone-readable command: kubectl get nodes
- Table mock: nodes Ready in green.
- Second panel: kube-system namespace with API server / etcd Pods.
- Red X on jumping straight to app logs.
- Highlight: "kubectl get nodes", "kube-system", "Ready".

---

Scene 6

Narration:

"Rule to remember: the control plane decides and reconciles. Worker nodes execute."

Animation:

- Two-line rule card:
  - Control Plane = decides + reconciles
  - Worker Nodes = execute
- Camera slowly zooms out into CTA card.

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
  - Control Plane
  - API Server
  - etcd
  - Scheduler
  - Controllers
  - Worker Nodes
  - kubelet
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003 (same colors, caption style, CTA, brand footer).
