Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: StatefulSet

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "StatefulSet"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why aren't databases usually run with a Deployment?
Scene 2: Because a Deployment treats Pods as interchangeable cattle - random names, no stable storage, any order. A database needs identity. That is what a StatefulSet gives: stable network names like db-0, db-1, db-2, and its own persistent volume that follows each Pod across restarts.
Scene 3: StatefulSets also start and scale in order. Pod zero comes up before Pod one, which matters for clustered systems that elect a primary or join members one by one. Each Pod keeps its PersistentVolumeClaim, so db-0 always reattaches to db-0 data.
Scene 4: What beginners get wrong: running Postgres in a plain Deployment, then losing data when the Pod reschedules onto another node with no volume. Or expecting a StatefulSet to auto-replicate data - it manages identity and storage, not your app's replication logic. Check kubectl get pvc for per-Pod claims.
Scene 5: Rule to remember: stable identity plus sticky storage means StatefulSet, not Deployment.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
