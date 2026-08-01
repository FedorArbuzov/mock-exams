import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "CLI variables";

export const AUDIO_SRC = "audio/terraform/057-dash-var-and-dash-var-file-on-the-cli.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.26;

export const HIGHLIGHT_WORDS = [
  "CLI",
  "variables",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "EXPLICIT",
  chips: [
    "var",
    "file",
    "CI",
  ],
  lines: [
    "$ terraform plan -var-file=prod.tfvars",
  ],
  bad: "Secret CLI",
  good: "Protected file",
  stamp: "SHOW SOURCES",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "CLI variables are explicit, but command history remembers." },
  { id: "explain", text: "The dash var option sets one variable value on a Terraform command, while dash var-file loads assignments from a specified file. They are useful for automation and one-off overrides because the command makes value sources explicit rather than relying on automatic loading." },
  { id: "detail", text: "Use dash var-file for reviewed environment inputs in CI. Quote values correctly for your shell, especially strings and collections. For sensitive values, prefer protected environment variables or a secure generated file, because command-line arguments may be visible in logs and process listings." },
  { id: "pitfall", text: "Multiple variable sources follow precedence rules, so an unexpected dash var can override an expected tfvars value. Passing secrets with dash var risks shell history and CI logs. Never assume a command-line override remains documented after the terminal closes." },
  { id: "rule", text: "Use explicit files for environments; never expose secrets on commands." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
