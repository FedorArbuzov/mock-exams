import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Terraform IAM";

export const AUDIO_SRC = "audio/terraform/066-least-privilege-for-terraform-itself.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.65;

export const HIGHLIGHT_WORDS = [
  "IAM",
  "least privilege",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "RUNNER",
  chips: [
    "role",
    "scoped",
    "short-lived",
  ],
  lines: [
    "CI -> assumed role",
  ],
  bad: "Admin forever",
  good: "Scoped session",
  stamp: "LIMIT BLAST RADIUS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Terraform's credentials need limits too." },
  { id: "explain", text: "Terraform runs with cloud credentials, usually from a user, role, workload identity, or CI federation. Those credentials can create, update, and delete whatever their policies allow. Least privilege for Terraform limits blast radius while still permitting the managed configuration to operate." },
  { id: "detail", text: "Use short-lived role sessions and separate identities per environment. Scope actions and resources to what each root module manages, including state backend access. Review provider APIs needed for reads as well as writes, because planning commonly requires discovery permissions." },
  { id: "pitfall", text: "Starting with broad administrator access may hide missing permissions until a later hardening effort. Overly narrow policies can also break plans in confusing ways. Build permissions from reviewed operations, test in lower environments, and audit actual usage." },
  { id: "rule", text: "Give each Terraform runner only the scoped access it needs." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
