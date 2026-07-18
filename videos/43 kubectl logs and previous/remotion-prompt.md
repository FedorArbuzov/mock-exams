Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: kubectl logs --previous

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "kubectl logs --previous"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: The container crashed and logs show nothing - now what?
Scene 2: Use dash dash previous. When a container restarts, the current logs belong to the fresh instance, which may be empty. The evidence of the crash lives in the previous container's logs. kubectl logs your-pod dash dash previous prints them.
Scene 3: Know the other flags too. If a Pod has multiple containers, add dash c and the container name, or logs will complain. dash f follows live output. dash dash tail equals 100 limits volume. dash dash since equals 10m scopes to a time window.
Scene 4: What beginners get wrong: reading empty current logs during a CrashLoopBackOff and concluding there is nothing to see. Or forgetting dash c on a multi-container Pod and getting an error. Flow: rising RESTARTS, then logs dash dash previous reveals the stack trace.
Scene 5: Rule to remember: crash loop means read dash dash previous, not the empty current log.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
