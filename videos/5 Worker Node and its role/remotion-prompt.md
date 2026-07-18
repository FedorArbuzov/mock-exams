Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Worker Node and its role

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

"Where does your application actually run?"

Animation:

- TopicBanner: "Worker Node"
- App container icon floats in a cloud labeled Kubernetes with a question mark.
- Arrow pulls it down toward a concrete server rack.
- Highlight: "application", "run".

---

Scene 2

Narration:

"Not on the control plane. Not on 'Kubernetes' as an abstract cloud. Your app runs on a worker node: a real machine with CPU, memory, disk, a kubelet agent, and a container runtime like containerd."

Animation:

- Cross out control plane and abstract cloud.
- Worker node diagram with badges: CPU, Memory, Disk, kubelet, containerd.
- Pod lands inside the node boundary.
- Highlight: "worker node", "kubelet", "containerd".

---

Scene 3

Narration:

"The control plane decides what should run and where. The worker node makes it happen. It pulls images, starts containers, mounts volumes, and reports status back up to the API server."

Animation:

- Top: control plane sends placement decision arrow.
- Bottom: worker node sequence:
  - pull image
  - start container
  - mount volume
  - status report up to API server
- Highlight: "decides", "pulls", "reports".

---

Scene 4

Narration:

"What breaks: a worker node can flip to NotReady when the kubelet stops, the disk fills up, or memory pressure evicts Pods. Your Deployment may look fine in YAML while every Pod on that node is gone. Beginners chase application bugs when the node itself is sick."

Animation:

- Node turns red: NotReady.
- Pressure bars: DiskPressure, MemoryPressure.
- Pods evicted / vanish from the node.
- YAML Deployment card still shows green desired state.
- Beginner magnifying glass on app code gets redirected to the node.
- Highlight: "NotReady", "MemoryPressure", "DiskPressure".

---

Scene 5

Narration:

"Practical check: kubectl get nodes. If STATUS is NotReady or you see MemoryPressure or DiskPressure, run kubectl describe node and read the Conditions section first."

Animation:

- Large command: kubectl get nodes
- Table row flashes NotReady in red.
- Transition to: kubectl describe node
- Conditions panel zoom: Ready=False, MemoryPressure=True.
- Highlight: "kubectl get nodes", "describe node", "Conditions".

---

Scene 6

Narration:

"Memorable rule: worker nodes are where containers live. Always ask: which node is hosting this Pod?"

Animation:

- Rule card: Worker Node = where containers live
- Secondary prompt: Which node hosts this Pod?
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
  - Worker Node
  - kubelet
  - containerd
  - NotReady
  - MemoryPressure
  - DiskPressure
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003.
