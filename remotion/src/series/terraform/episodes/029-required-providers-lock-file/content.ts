import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Provider Locking";

export const AUDIO_SRC = "audio/terraform/029-required-providers-lock-file.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.13;

export const HIGHLIGHT_WORDS = [
  "required_providers",
  "lock file",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "lock providers",
  chips: [
    "declare",
    "lock",
    "commit",
  ],
  lines: [
    "required_providers",
    ".terraform.lock.hcl",
    "init -upgrade",
  ],
  bad: "version surprise",
  good: "locked build",
  stamp: "COMMIT THE LOCK FILE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why commit the lock file?" },
  { id: "explain", text: "The required_providers block says which providers your configuration needs and which versions are acceptable. Terraform init then writes selected versions and checksums into .terraform.lock.hcl. That lock file helps every developer and CI runner install the same verified provider package." },
  { id: "detail", text: "Commit .terraform.lock.hcl for normal Terraform projects and review changes to it in pull requests. Run terraform init -upgrade only when you intentionally want newer permitted provider versions. Required providers are policy; the lock file records the exact dependency decision made for this project." },
  { id: "pitfall", text: "Do not confuse the lock file with state or ignore it as generated noise. Deleting it casually can cause different machines to choose different provider versions inside the allowed version range." },
  { id: "rule", text: "Declare provider ranges, then commit the exact locked provider selections." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
