Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl top

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl top"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: How do you see CPU and memory usage right in the CLI?
Scene 2: kubectl top. top nodes shows CPU and memory per node; top pods shows it per Pod. It is the fastest way to spot what is hot without a dashboard - perfect for catching a memory hog or a saturated node.
Scene 3: But there is a catch: kubectl top needs Metrics Server installed. It scrapes the kubelets and serves live usage. Without it, top returns Metrics API not available - which confuses beginners into thinking the command is broken.
Scene 4: What beginners get wrong: expecting top on a fresh cluster, or confusing live usage with the requests and limits in YAML. top shows actual consumption now; requests and limits are your declared budget.
Scene 5: Rule to remember: kubectl top shows live usage - but only when Metrics Server is running.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
