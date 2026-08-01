import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "What is Terraform";

export const AUDIO_SRC = "audio/terraform/001-what-is-terraform-in-30-seconds.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 38.40;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "Terraform",
  "Infrastructure as Code",
  "provider",
  "terraform plan",
  "terraform apply",
  "state file",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Everyone says use Terraform - what does it actually do?",
  },
  {
    id: "explain",
    text: "Terraform is Infrastructure as Code. You write configuration files, usually with a .tf extension, that describe the cloud resources you want. A provider plugin - AWS, Kubernetes, GitHub - turns that description into API calls.",
  },
  {
    id: "flow",
    text: "You do not invent a long bash script of creates. You declare the desired end state. Then you run terraform plan to preview creates, updates, and deletes, and terraform apply to execute that plan. The state file remembers which real IDs map to which blocks in your code.",
  },
  {
    id: "pitfall",
    text: "Beginners skip plan and treat apply like a deploy button. That is how surprises land in production. Make plan the review, apply the commit.",
  },
  {
    id: "rule",
    text: "Mental model: files describe intent, plan shows the diff, apply changes the world, state keeps the map.",
  },
  {
    id: "cta",
    text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
