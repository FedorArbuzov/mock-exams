Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: ConfigMap

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "ConfigMap"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why should configuration live outside your container image?
Scene 2: Because baking config into the image means a rebuild for every setting change, and the same image cannot move cleanly between dev and prod. A ConfigMap fixes that. It stores non-secret settings - URLs, feature flags, whole config files - as key/value data the cluster owns.
Scene 3: You consume it two ways: as environment variables with envFrom or valueFrom, or mounted as files in a volume. Mounting is handy for full config files an app reads at startup.
Scene 4: What beginners get wrong: expecting a Pod to pick up ConfigMap changes instantly. Env vars are injected only at container start, so a change needs a rollout. Mounted files update eventually, but the app must re-read them. And ConfigMaps are not for secrets - values are plain text.
Scene 5: Rule to remember: config outside the image - but env changes need a restart.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
