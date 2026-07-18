Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: API Server - the single control entrypoint

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

"Where do all your kubectl commands actually go?"

Animation:

- TopicBanner: "API Server"
- kubectl terminal icon fires multiple command arrows.
- All arrows converge on one glowing gateway labeled API Server.
- Highlight: "kubectl", "commands".

---

Scene 2

Narration:

"Straight to the API server. kubectl is just a client. Every get, apply, delete, and patch request hits that one central entry point before anything changes in the cluster."

Animation:

- kubectl labeled Client on the left.
- Four request types animate in: get, apply, delete, patch.
- Single door/gateway: API Server.
- No side doors — red X on alternate paths.
- Highlight: "client", "get", "apply", "entry point".

---

Scene 3

Narration:

"The API server authenticates you, checks authorization with RBAC, validates the object schema, and only then reads from or writes to etcd. Controllers and kubelets watch the API server too. There is no hidden side channel for cluster changes."

Animation:

- Security pipeline inside API server:
  - Authenticate (user badge)
  - RBAC authorize (lock/check)
  - Validate schema (document check)
  - Read/write etcd
- Controllers and kubelets connect via watch lines to the same API server.
- Side channel paths blocked with red slashes.
- Highlight: "RBAC", "validates", "etcd", "watch".

---

Scene 4

Narration:

"What breaks: when the API server is unreachable, kubectl fails immediately. No deploys, no scaling, no debugging through the control path. Beginners SSH into nodes and edit containers manually, which creates drift the controllers will fight later."

Animation:

- API server turns red / unreachable.
- kubectl commands bounce off with error flash.
- Deploy and scale icons freeze.
- SSH path to node with manual container edit — drift warning triangle.
- Controller loop tries to revert manual change.
- Highlight: "unreachable", "kubectl fails", "drift".

---

Scene 5

Narration:

"Practical check: run kubectl cluster-info. If the API endpoint fails, fix connectivity or credentials before you debug Pod logs."

Animation:

- Large command: kubectl cluster-info
- Success: API endpoint URL green.
- Failure variant: connection error — fix kubeconfig first.
- Red X on jumping to Pod logs too early.
- Highlight: "cluster-info", "API endpoint", "credentials".

---

Scene 6

Narration:

"Rule to remember: one front door, one write path. If kubectl cannot reach the API server, the control plane is not reachable."

Animation:

- Rule card with door icon: One front door. One write path.
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
  - API Server
  - kubectl
  - RBAC
  - etcd
  - Controllers
  - kubelet
  - Link in Bio
- Keep `exallenge.tech` on screen for the full duration as a small persistent footer under captions.
- Export in 1080x1920 at 30 FPS.
- Match series look from episodes 001-003.
