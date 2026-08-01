import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Providers";

export const AUDIO_SRC = "audio/terraform/005-providers-plugins-that-talk-to-clouds.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 57.55;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "provider",
  "init",
  "lock file",
  "AWS",
  "plugin",
  "required_providers",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "How does Terraform know how to call AWS?",
  },
  {
    id: "explain",
    text: "Terraform core does not hardcode every cloud API. A provider is a plugin - hashicorp slash aws, kubernetes, random - that registers resource types and talks to the real API. Your configuration declares required_providers, then a provider block with region and other settings.",
  },
  {
    id: "init",
    text: "terraform init downloads those plugins and records versions in the lock file. Without init, plan cannot even start. Pin versions so yesterday's green plan does not surprise you after a major provider bump.",
  },
  {
    id: "pitfall",
    text: "Beginners commit code without required_providers and wonder why a teammate's machine invents a different plugin version. Lock what works.",
  },
  {
    id: "rule",
    text: "Rule: core orchestrates; providers implement; init installs the contract.",
  },
  {
    id: "cta",
    text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
