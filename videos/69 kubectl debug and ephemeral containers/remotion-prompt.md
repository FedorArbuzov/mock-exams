Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl debug

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl debug"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: No shell in the image - how do you debug inside the Pod?
Scene 2: kubectl debug. Modern images are often distroless or scratch - no shell, no curl - great for security but painful to inspect. An ephemeral container solves this: kubectl debug attaches a temporary container into a running Pod, sharing its process and network namespace.
Scene 3: Now you get a full toolbox next to the failing app without rebuilding the image. Inspect processes, curl a dependency using the Pod's own network, or check the mounted filesystem - from a container carrying the tools the app left out.
Scene 4: What beginners get wrong: trying kubectl exec on a distroless image and getting no such file for sh. Or forgetting ephemeral containers are temporary and cannot be removed individually. Flow: debug dash dash image busybox dash dash target app.
Scene 5: Rule to remember: no shell in the image means kubectl debug, not exec.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
