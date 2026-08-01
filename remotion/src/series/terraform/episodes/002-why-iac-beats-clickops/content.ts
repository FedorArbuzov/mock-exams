import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "IaC vs ClickOps";

export const AUDIO_SRC = "audio/terraform/002-why-iac-beats-clickops.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 56.95;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "ClickOps",
  "Infrastructure as Code",
  "pull request",
  "terraform plan",
  "drift",
  "Console",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Why not just click in the AWS Console?",
  },
  {
    id: "pain",
    text: "ClickOps is fine for a one-off experiment. The pain starts when you need the same VPC next week, or a teammate must rebuild what you clicked at midnight. Console clicks leave no reviewable history and no safe preview of blast radius.",
  },
  {
    id: "git",
    text: "Infrastructure as Code puts the same resources in Git. A pull request shows the terraform plan: what will be created, changed, or destroyed. You can reject a bad change before apply. Rebuilds become reruns, not archaeology in the Console.",
  },
  {
    id: "drift",
    text: "Teams still ClickOps under pressure, then wonder why drift appears. If the Console is the source of truth, Terraform will fight you every plan.",
  },
  {
    id: "rule",
    text: "Rule: if you will create it twice, or share it with a teammate, put it in code first.",
  },
  {
    id: "cta",
    text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
