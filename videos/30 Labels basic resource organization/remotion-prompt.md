Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Labels

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Labels"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: What does grouping in Kubernetes actually rely on?
Scene 2: Labels. A label is a key/value tag you attach to objects - app equals api, env equals prod, tier equals backend. They are not just documentation. Controllers and Services use labels to find the Pods they manage, so labels are load-bearing infrastructure.
Scene 3: You query them with label selectors. kubectl get pods dash l app equals api returns just those Pods. A Deployment's selector decides which Pods it owns. A Service's selector decides which Pods receive its traffic. Change a label and you can hand a Pod to a different owner.
Scene 4: What beginners get wrong: inconsistent labels across a team, so nothing lines up. Or editing a running Pod's labels and pulling it out from under its ReplicaSet, which then spins up a replacement. Adopt the standard app dot kubernetes dot io labels for consistency.
Scene 5: Rule to remember: labels are not comments - Services and controllers select on them.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
