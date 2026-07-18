Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: etcd - where cluster state lives

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

"Where is the source of truth for everything in your cluster?"

Animation:

- TopicBanner: "etcd"
- Cluster diagram with many moving parts blurs.
- One database cylinder labeled etcd glows bright at the center.
- Highlight: "source of truth", "cluster".

---

Scene 2

Narration:

"etcd. It is a distributed key-value store on the control plane that holds every Kubernetes object: desired Deployments, live Pod status, Service definitions, Secrets metadata, all of it."

Animation:

- etcd cluster (3 nodes) with key-value pairs scrolling inside.
- Object type chips orbit: Deployment, Pod, Service, Secret.
- Labels: desired state + live status.
- Highlight: "key-value", "Deployments", "Pod status", "Services".

---

Scene 3

Narration:

"When you kubectl apply, the API server writes your change to etcd. Controllers read through the API and react. kubelets report actual state back up, and that too lands in etcd. Desired plus actual both live here."

Animation:

- Circular flow:
  - kubectl apply → API server → etcd write
  - controllers read → react
  - kubelet reports actual → API server → etcd update
- Two lanes inside etcd: Desired | Actual.
- Highlight: "apply", "writes", "actual state", "Desired".

---

Scene 4

Narration:

"What breaks: lose or corrupt etcd and you lose the cluster memory. Restarts without backups can mean starting from zero. Beginners treat etcd like background noise until a failed upgrade erases their entire fleet state."

Animation:

- etcd cylinder cracks / goes dark.
- Cluster objects dissolve into empty space.
- Backup tape icon with red warning when missing.
- Upgrade arrow hits etcd — fleet state wiped animation.
- Highlight: "corrupt", "backups", "cluster memory".

---

Scene 5

Narration:

"Practical check: if the API feels broken after a control plane restart, verify etcd member Pods are Running in kube-system before blaming workloads."

Animation:

- Scenario: control plane restart flash.
- kubectl errors on screen.
- Pivot to kube-system namespace list.
- etcd member Pods highlighted Running (or red if not).
- Highlight: "etcd", "kube-system", "Running".

---

Scene 6

Narration:

"Rule to remember: etcd is the source of truth. Backup etcd before you need to prove it."

Animation:

- Rule card with database + shield icon.
- Backup reminder badge pulses.
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
  - etcd
  - source of truth
  - desired state
  - actual state
  - backup
  - kube-system
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003.
