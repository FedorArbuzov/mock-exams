import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Version Guardrails";

export const AUDIO_SRC = "audio/terraform/014-terraform-version-and-required-version.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.42;

export const HIGHLIGHT_WORDS = [
  "version",
  "required_version",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "version guard",
  chips: [
    "CLI",
    "config",
    "CI",
  ],
  lines: [
    "$ terraform version",
    "required_version",
  ],
  bad: "version drift",
  good: "tested range",
  stamp: "PIN THE CLI RANGE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why pin the Terraform CLI version?" },
  { id: "explain", text: "The terraform version command reports the installed CLI and initialized providers. The required_version setting declares which Terraform CLI versions may run a configuration. It prevents a teammate or pipeline from using an unsupported release and producing surprising behavior or errors." },
  { id: "detail", text: "Put required_version in a terraform block near your provider requirements. For example, choose a tested version range that matches your team policy, then run terraform init. Check terraform version in CI too, so a local success and pipeline failure do not come from different binaries." },
  { id: "pitfall", text: "Pinning only provider versions while leaving the Terraform CLI unrestricted can still create compatibility trouble. An overly narrow exact version can also make routine updates painful when your team legitimately needs a patch release." },
  { id: "rule", text: "Declare the Terraform versions your configuration is tested to support." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
