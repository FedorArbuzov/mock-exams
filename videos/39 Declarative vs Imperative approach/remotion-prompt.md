Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: Declarative vs Imperative

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "Declarative vs Imperative"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Should you write YAML files or fire kubectl by hand?
Scene 2: Both have a place. Imperative means you tell Kubernetes the exact action - kubectl run, kubectl create, kubectl scale. Fast for experiments. Declarative means you write a manifest describing the desired end state and run kubectl apply. Kubernetes figures out the diff and makes reality match.
Scene 3: For anything real, declarative wins. Your YAML lives in Git, so you get history, review, and rollback. Re-running apply is safe and idempotent. Imperative changes vanish from memory - nobody knows why prod looks the way it does.
Scene 4: What beginners get wrong: building a cluster with a pile of imperative commands, then being unable to recreate it. Or mixing both, so a hand-edit gets overwritten by the next apply. Tip: generate YAML with dash dash dry-run equals client dash o yaml, then commit and manage it declaratively.
Scene 5: Rule to remember: imperative to explore, declarative to operate.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
