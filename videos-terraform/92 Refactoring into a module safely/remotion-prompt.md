Terraform short 92: Refactoring into a module safely

TopicBanner: Module refactoring
Uses shared templates (Hook / Chips / Code / Contrast / Rule) + CTAScene.
Visual: {"mark": "MOVE", "chips": ["old", "map", "new"], "lines": ["moved { from = aws_s3_bucket.x", "to = module.logs.aws_s3_bucket.this }"], "bad": "Destroy and recreate", "good": "Preserve remote object", "stamp": "SHORT RULE"}
