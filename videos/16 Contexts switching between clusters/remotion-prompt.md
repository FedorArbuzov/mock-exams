Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl contexts

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl contexts"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you work with multiple clusters using one kubectl?
Scene 2: A context is a named pointer: which cluster, which user credentials, and often which default namespace. You keep many contexts in one kubeconfig, then switch with kubectl config use-context. Listing them is kubectl config get-contexts. The star marks the current one.
Scene 3: What breaks: you apply a Deployment thinking you are on kind, but the current context is staging. The command succeeds, and you just shipped to the wrong place. Context mistakes look like success in the terminal.
Scene 4: Practical habit: before any apply, delete, or scale, run kubectl config current-context. Say the name out loud. For day-to-day work, also set a clear namespace with kubectl config set-context --current --namespace equals my-app, so get pods does not surprise you with empty output in default.
Scene 5: Rule to remember: context chooses the cluster - check it before every write.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
