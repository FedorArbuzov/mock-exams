Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: ImagePullSecrets

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "ImagePullSecrets"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How does a Pod pull from a private registry?
Scene 2: By default the kubelet only pulls public images. For a private registry you create a docker-registry Secret that holds the login, then reference it. You can attach it per Pod with imagePullSecrets, or add it to a ServiceAccount so every Pod using that account inherits access.
Scene 3: What breaks: people push to a private repo, apply the Deployment, and get ImagePullBackOff with an authentication or not found error. The image exists - the node just has no credentials. Or the Secret lives in the wrong namespace, because pull Secrets are namespaced.
Scene 4: Practical steps: create the Secret with kubectl create secret docker-registry, in the same namespace as the Pod. Reference it under imagePullSecrets in the Pod spec, or patch the default ServiceAccount. Then kubectl describe pod to confirm the pull now succeeds.
Scene 5: Rule to remember: private image, no Secret in the right namespace, no Pod.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
