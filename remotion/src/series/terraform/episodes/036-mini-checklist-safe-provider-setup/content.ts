import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Safe Providers";

export const AUDIO_SRC = "audio/terraform/036-mini-checklist-safe-provider-setup.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.75;

export const HIGHLIGHT_WORDS = [
  "checklist",
  "provider",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "safe provider",
  chips: [
    "version",
    "role",
    "region",
  ],
  lines: [
    "required_providers",
    "AWS_PROFILE=...",
    "$ terraform plan",
  ],
  bad: "hidden defaults",
  good: "explicit setup",
  stamp: "PROVIDER SAFETY CHECK",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Is your provider setup safe enough to share?" },
  { id: "explain", text: "A safe provider setup declares provider versions, uses a clear region or target, and obtains credentials through an approved external chain. It keeps keys out of code, uses least-privilege roles, and locks selected provider packages. These choices make local work and CI more predictable." },
  { id: "detail", text: "Check required_providers, required_version, region selection, credential source, aliases, and default tags. Commit the dependency lock file, but never commit secret files or local state. Run init, validate, and plan with the intended account before making a first apply." },
  { id: "pitfall", text: "A configuration can look clean while silently using a personal administrator profile. Test with the same role model CI will use, otherwise permissions and targets can differ at the worst moment." },
  { id: "rule", text: "Explicit versions, explicit targets, external credentials, least privilege." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
