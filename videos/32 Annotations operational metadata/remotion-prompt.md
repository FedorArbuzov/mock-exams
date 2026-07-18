Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Annotations

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Annotations"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Where do you put metadata that must not affect selection?
Scene 2: Annotations. Like labels, they are key/value pairs on an object, but nothing selects on them. They hold arbitrary, often larger, operational metadata: a change-cause for a rollout, a checksum to force a restart, ingress tuning, or config for a controller.
Scene 3: The split matters. Labels are for identifying and grouping - keep them short and queryable. Annotations are for tools and humans - build info, contact owner, last-applied config, or feature flags read by an operator. Many controllers are configured entirely through annotations.
Scene 4: What beginners get wrong: stuffing big values into labels, which have strict length limits, instead of annotations. Or expecting a Service to select Pods by an annotation - it cannot. Check kubectl describe for both sections; kubectl annotate updates one without touching labels.
Scene 5: Rule to remember: label to select, annotate to describe.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
