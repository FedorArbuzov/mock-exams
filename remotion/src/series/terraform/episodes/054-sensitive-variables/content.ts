import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "sensitive inputs";

export const AUDIO_SRC = "audio/terraform/054-sensitive-variables.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.19;

export const HIGHLIGHT_WORDS = [
  "sensitive",
  "secrets",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "REDACT",
  chips: [
    "hide",
    "state",
    "access",
  ],
  lines: [
    "sensitive = true",
  ],
  bad: "Secret in Git",
  good: "Secret manager",
  stamp: "HIDE IS NOT LOCK",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Sensitive hides display, not access or storage." },
  { id: "explain", text: "Marking a variable sensitive tells Terraform to redact its value in many CLI outputs. This reduces accidental disclosure in plans and logs. It does not encrypt the value, prevent providers from receiving it, or remove it from Terraform state." },
  { id: "detail", text: "Pass secrets through a dedicated secret manager, protected CI variables, or short-lived identity whenever possible. Limit who can read state and plan artifacts. Use sensitive = true for secret-like inputs and outputs, but design storage and access as the real protection." },
  { id: "pitfall", text: "Sensitive values can still appear in state, debugging output, provider errors, or external tools. Do not assume redaction means safe to commit a tfvars file. Also avoid using secrets in resource names, tags, or keys that must remain visible." },
  { id: "rule", text: "Redact sensitive values, but secure state, logs, and secret delivery." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
