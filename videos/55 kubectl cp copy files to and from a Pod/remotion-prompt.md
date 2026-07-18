Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl cp

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl cp"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you pull a log file or config out of a container?
Scene 2: kubectl cp. It copies files between your machine and a Pod, similar to secure copy. kubectl cp my-pod colon path pulls a file down. Reverse the arguments to push a file into the Pod.
Scene 3: Use cases: grab a crash dump, extract a generated config, or drop a temporary debug script. Specify the container with dash c when the Pod has more than one. Paths are container filesystem paths, not host paths.
Scene 4: What beginners get wrong: expecting cp on distroless images, copying huge folders, or treating pushed files as permanent - restarts wipe the container filesystem. Prefer volumes for lasting data.
Scene 5: Rule to remember: kubectl cp is a temporary bridge - not your backup strategy.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
