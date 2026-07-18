Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: imagePullPolicy

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "imagePullPolicy"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why does your Pod still run old code after a deploy?
Scene 2: Often it is imagePullPolicy. This field tells the kubelet when to re-download an image. IfNotPresent uses the cached image if the node already has that tag. Always pulls every time a container starts. Never only uses what is local and never fetches.
Scene 3: The gotcha: if you keep pushing the same tag, IfNotPresent sees the tag locally and skips the pull, so your new code never lands. Kubernetes defaults to Always only when the tag is latest, and to IfNotPresent otherwise. That surprises people who reuse a fixed tag for every build.
Scene 4: Practical fix: use unique, immutable tags per build so there is nothing stale to cache. If you must reuse a tag during development, set imagePullPolicy to Always. Confirm with kubectl describe pod that the image ID actually changed after rollout.
Scene 5: Rule to remember: same tag plus IfNotPresent equals stale Pods.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
