Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: ImagePullBackOff

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "ImagePullBackOff"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why won't your container image download?
Scene 2: That is ErrImagePull, and after retries it becomes ImagePullBackOff - Kubernetes backing off before trying again. The container never starts because the kubelet cannot fetch the image. The fix is almost always one of four things.
Scene 3: First, the name or tag is wrong. Second, the registry is private and you have no valid imagePullSecret. Third, the node cannot reach the registry - DNS or egress blocked. Fourth, you hit a rate limit, classic with anonymous Docker Hub.
Scene 4: What beginners get wrong: staring at logs, which are empty because no container ran. Flow: kubectl describe pod and read the Events line - it says manifest unknown, unauthorized, or no such host.
Scene 5: Rule to remember: ImagePullBackOff is a fetch problem - check name, tag, secret, network.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
