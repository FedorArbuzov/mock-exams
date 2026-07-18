Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Protect prod context

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Protect prod context"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you avoid deploying to prod by accident?
Scene 2: Separate contexts with loud names. Call them kind-dev, staging, and prod - never cluster-one and cluster-two. Color your shell prompt with the current context if you can. Never reuse the same short alias for local and production.
Scene 3: What beginners get wrong: one shared context name after merging kubeconfig files, or running kubectl apply from muscle memory while Slack is distracting them. Production outages often start with a successful apply to the wrong cluster.
Scene 4: Practical checklist before apply: kubectl config current-context must show the expected name. kubectl get nodes should match the environment you think you are in. Prefer dry-run when unsure. For prod, confirm namespace, context, and change.
Scene 5: Rule to remember: current-context before apply - every time, no exceptions.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
