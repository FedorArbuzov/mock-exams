Terraform short 35: Never hardcode secrets in .tf

TopicBanner: Secret Safety
Uses shared templates (Hook / Chips / Code / Contrast / Rule) + CTAScene.
Visual: {"mark": "no secrets in .tf", "chips": ["env", "vault", "rotate"], "lines": ["variable \"token\"", "TF_VAR_token", "secret manager"], "bad": "secret in Git", "good": "runtime secret", "stamp": "CODE IS NOT A VAULT"}
