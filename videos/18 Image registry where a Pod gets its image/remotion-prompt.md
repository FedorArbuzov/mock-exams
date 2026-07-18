Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Image registry

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Image registry"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Where does Kubernetes actually get your container image?
Scene 2: Not from your laptop. When a Pod is scheduled to a node, the kubelet on that node reads the image field and pulls it from a registry - Docker Hub, GitHub Container Registry, ECR, GCR, or a private one. The image name encodes the registry, repository, and tag.
Scene 3: What breaks: if the node cannot reach the registry, or the name is wrong, the Pod never starts. You see ErrImagePull, then ImagePullBackOff as Kubernetes retries with backoff. This is not a crash inside your app - the container image never arrived.
Scene 4: Practical checks: kubectl describe pod and read the Events at the bottom. They tell you the exact image reference and the pull error. Confirm the tag exists, the registry is reachable from the node, and the name has no typo.
Scene 5: Rule to remember: ImagePullBackOff is a delivery problem, not a code problem.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
