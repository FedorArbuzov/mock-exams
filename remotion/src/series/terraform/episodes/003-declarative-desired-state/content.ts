import type {SceneScript} from "../../../../shared/types";

export const TOPIC_TITLE = "Desired State";

export const AUDIO_SRC = "audio/terraform/003-declarative-desired-state.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 58.08;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "declarative",
  "desired state",
  "Idempotency",
  "terraform plan",
  "apply",
  "destroy and recreate",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Do I write scripts that create a bucket step by step?",
  },
  {
    id: "declare",
    text: "No. Terraform is declarative. You describe the desired end state - this bucket exists, with these settings - not a procedural checklist of API calls. Terraform builds a graph, compares desired state to the state file and the live provider, and computes a diff.",
  },
  {
    id: "idempotent",
    text: "That is why a second apply with no code changes reports No changes. Idempotency is the goal. Imperative scripts often create duplicates unless you carefully code every if-exists branch yourself.",
  },
  {
    id: "pitfall",
    text: "Beginners mix mental models: they treat apply like a one-shot installer, then panic when a rename wants to destroy and recreate. Read the plan. The plan is the contract.",
  },
  {
    id: "rule",
    text: "Remember: you declare the destination; Terraform figures out the route.",
  },
  {
    id: "cta",
    text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio.",
  },
];
