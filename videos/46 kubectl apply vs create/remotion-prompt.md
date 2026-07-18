Create a 9:16 vertical animated explainer video for Instagram Reels.

Topic: apply vs create

Style:
- Modern motion graphics, dark (#0B1020), cyan/green accents.
- TopicBanner on scene 1: "apply vs create"
- Brand footer: exallenge.tech
- Captions synced to narration; large phone-readable type.

Scene 1: Why does kubectl create fail the second time you run it?
Scene 2: Because create is imperative and one-shot: it makes a new object, and if it already exists, it errors with AlreadyExists. apply is declarative and idempotent: it creates the object if missing, and updates it to match your manifest if it exists. Run apply a hundred times, same result.
Scene 3: The deeper difference is updates. apply records your manifest as the last-applied configuration, so it can compute a three-way merge and change only what you changed. create has no such memory - it just refuses when the name is taken.
Scene 4: What beginners get wrong: scripting create in CI, which breaks on the second deploy. Or mixing create and apply on the same object, which confuses last-applied tracking. Tip: use apply for files; reserve create for throwaway objects or generating YAML.
Scene 5: Rule to remember: create makes once, apply reconciles every time.
CTA: Master Kubernetes faster. Theory, hands-on labs, and interview questions - link in bio.
