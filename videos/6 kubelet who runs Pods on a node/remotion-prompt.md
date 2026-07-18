Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubelet - who runs Pods on a node

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

"What on the node actually watches your Pod?"

Animation:

- TopicBanner: "kubelet"
- Single worker node with a Pod inside.
- Magnifying glass scans the node surface.
- kubelet daemon icon glows on the node edge.
- Highlight: "node", "Pod", "watches".

---

Scene 2

Narration:

"The kubelet. It is a daemon on every worker node that talks to the API server, receives PodSpecs, and tells the container runtime to start, stop, or restart containers locally."

Animation:

- kubelet as central hub on the node.
- Bidirectional arrow to API server (cloud above).
- PodSpec document flows down into kubelet.
- kubelet commands container runtime (containerd icon).
- Actions flash: start, stop, restart.
- Highlight: "kubelet", "API server", "PodSpec", "runtime".

---

Scene 3

Narration:

"When you kubectl apply a Deployment, the control plane decides a Pod should exist on node B. The kubelet on node B notices that assignment, pulls the image, creates the container, mounts volumes, runs health probes, and reports Running or CrashLoopBackOff back to the API server."

Animation:

- kubectl apply arrow from user.
- Pod assignment lands on Node B (highlighted).
- kubelet on Node B executes step chain:
  - pull image
  - create container
  - mount volume
  - health probe ping
  - status badge: Running or CrashLoopBackOff
- Status arrow returns to API server.
- Highlight: "node B", "pulls", "health probes", "Running".

---

Scene 4

Narration:

"What breaks: if the kubelet dies on a node, that node goes NotReady. Every Pod on it becomes orphaned to the cluster even if a container process is still alive on disk. Beginners delete and recreate Pods remotely when the local agent is broken."

Animation:

- kubelet icon turns off / gray.
- Node flips to NotReady.
- Pods on node show orphaned/disconnected from cluster view.
- Container process ghost still running locally (dim).
- Remote kubectl delete loop repeats with no fix.
- Highlight: "kubelet dies", "NotReady", "orphaned".

---

Scene 5

Narration:

"Practical check: kubectl get nodes and look for NotReady. Then kubectl describe node and read kubelet conditions plus events at the bottom."

Animation:

- Command: kubectl get nodes
- NotReady row pulses red.
- Command: kubectl describe node
- Conditions section + Events tail zoom in.
- Highlight: "NotReady", "describe node", "Events".

---

Scene 6

Narration:

"Rule to remember: the scheduler picks the node. The kubelet runs the Pod there."

Animation:

- Two-step diagram:
  - Scheduler → picks node
  - kubelet → runs Pod
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
  - kubelet
  - PodSpec
  - API Server
  - container runtime
  - NotReady
  - CrashLoopBackOff
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003.
