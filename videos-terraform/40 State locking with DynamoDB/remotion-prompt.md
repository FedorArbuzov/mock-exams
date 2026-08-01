Terraform short 40: State locking with DynamoDB

TopicBanner: State Locking
Uses shared templates (Hook / Chips / Code / Contrast / Rule) + CTAScene.
Visual: {"mark": "one apply at once", "chips": ["S3", "lock", "DynamoDB"], "lines": ["apply A: lock", "apply B: waits", "terraform force-unlock"], "bad": "two applies", "good": "one lock", "stamp": "LOCK BEFORE WRITING STATE"}
