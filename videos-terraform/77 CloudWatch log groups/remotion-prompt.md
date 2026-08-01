Terraform short 77: CloudWatch log groups

TopicBanner: CloudWatch Logs
Uses shared templates (Hook / Chips / Code / Contrast / Rule) + CTAScene.
Visual: {"mark": "LOG", "chips": ["app logs", "30 days", "KMS"], "lines": ["aws_cloudwatch_log_group", "retention_in_days = 30"], "bad": "Default retention forever", "good": "Declared log lifecycle", "stamp": "SHORT RULE"}
