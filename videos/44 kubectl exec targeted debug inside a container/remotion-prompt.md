Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl exec

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl exec"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you inspect an app from inside its container?
Scene 2: kubectl exec. It runs a command inside a running container - perfect for quick diagnostics. kubectl exec dash it your-pod dash dash sh opens a shell. From there you check environment variables, curl a dependency, resolve DNS, or read a config file the app actually loaded.
Scene 3: This is how you answer real questions. Is the ConfigMap mounted where the app expects? Can this Pod reach the database Service by name? What does env show for the injected settings? You are testing from the app's exact network and filesystem view.
Scene 4: What beginners get wrong: expecting bash in a minimal image that only has sh, or no shell in a distroless image. Also treating exec changes as permanent - anything you edit inside vanishes on restart. For images with no shell, use kubectl debug with an ephemeral container.
Scene 5: Rule to remember: exec is for looking inside, not for making lasting changes.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
