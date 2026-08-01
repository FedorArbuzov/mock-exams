import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Resource vs Data";

export const AUDIO_SRC = "audio/terraform/006-resources-vs-data-sources.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 57.94;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "resource",
  "data",
  "state",
  "destroy",
  "lifecycle",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "When do I use resource and when data?",
  },
  {
    id: "resource",
    text: "A resource block means Terraform manages the lifecycle - create, update, delete - and tracks it in state. A data source means read-only lookup of something that already exists: an AMI, a VPC you did not create in this stack, an IAM policy document.",
  },
  {
    id: "ownership",
    text: "Use data when you need an ID or attribute from outside your ownership boundary. Use resource when this configuration is responsible for the object. Mixing them wrong causes either orphaned Console objects or accidental destroys of shared infrastructure.",
  },
  {
    id: "pitfall",
    text: "Beginners data-source everything to feel safer, then never own a clean stack. Others resource-copy shared VPCs into every root module and create five networks named almost the same.",
  },
  {
    id: "rule",
    text: "Rule: resource owns; data observes; never destroy what you only meant to read.",
  },
  {
    id: "cta",
    text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
