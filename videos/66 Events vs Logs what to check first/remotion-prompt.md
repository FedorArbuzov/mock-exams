Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Events vs Logs

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Events vs Logs"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Empty logs mean there is no problem, right?
Scene 2: Wrong - and that assumption wastes hours. Events are Kubernetes talking about orchestration: scheduling, image pulls, probes, mounts, killings. Logs are your application talking - the code's output once the process is actually alive.
Scene 3: If the container never started, logs are empty - not because things are fine, but because there was nothing to log. The answer was in Events the whole time.
Scene 4: Rule: if the Pod is not Running - Pending, ImagePullBackOff, ConfigError - read Events first via describe. If it is Running or crashing after start, read logs, adding dash dash previous for the last crash.
Scene 5: Rule to remember: not started yet means Events; started then failed means logs.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
