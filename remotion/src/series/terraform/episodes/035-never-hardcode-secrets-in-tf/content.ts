import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Secret Safety";

export const AUDIO_SRC = "audio/terraform/035-never-hardcode-secrets-in-tf.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.24;

export const HIGHLIGHT_WORDS = [
  "secrets",
  "Git",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "no secrets in .tf",
  chips: [
    "env",
    "vault",
    "rotate",
  ],
  lines: [
    "variable \"token\"",
    "TF_VAR_token",
    "secret manager",
  ],
  bad: "secret in Git",
  good: "runtime secret",
  stamp: "CODE IS NOT A VAULT",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why is a secret in a Terraform file a problem?" },
  { id: "explain", text: "Hardcoded passwords, tokens, and access keys can leak through Git history, pull requests, backups, logs, and copied files. Even if a secret is removed later, previous commits may preserve it. Terraform code should reference secret delivery mechanisms instead of becoming the secret store." },
  { id: "detail", text: "Use environment variables, your CI secret manager, cloud secret services, or an approved external secret workflow. Keep secret variable files out of Git and restrict who can read remote state. Rotate any credential immediately if it is committed, then remove it from history using your security process." },
  { id: "pitfall", text: "Using a variable called password does not make a value safe when its default contains the actual secret. Sensitive markings reduce console display, but the value may still enter state or be available to provider APIs." },
  { id: "rule", text: "Reference secrets at runtime; never make source code their permanent home." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
