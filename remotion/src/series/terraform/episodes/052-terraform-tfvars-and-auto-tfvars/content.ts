import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "tfvars files";

export const AUDIO_SRC = "audio/terraform/052-terraform-tfvars-and-auto-tfvars.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.78;

export const HIGHLIGHT_WORDS = [
  "tfvars",
  "inputs",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "AUTO LOAD",
  chips: [
    "tfvars",
    "auto",
    "secret",
  ],
  lines: [
    "prod.auto.tfvars",
  ],
  bad: "Hidden values",
  good: "Documented files",
  stamp: "KNOW PRECEDENCE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Some variable files load automatically. That is powerful and risky." },
  { id: "explain", text: "Terraform automatically loads terraform.tfvars, terraform.tfvars.json, and files ending in .auto.tfvars or .auto.tfvars.json. These files assign root-module variable values. They are useful for stable local or environment values that should accompany the configuration." },
  { id: "detail", text: "Keep a checked-in example file for required values and use ignored files for local secrets. Automatic loading is simple, but explicit environment files passed through deployment commands make provenance clearer. Choose one team convention and document precedence for operators." },
  { id: "pitfall", text: "A forgotten star.auto.tfvars file can silently alter a plan on one machine. Different automatic files also make it unclear which values won. Avoid placing production secrets in version control, even if a variable is marked sensitive." },
  { id: "rule", text: "Use predictable tfvars conventions and keep secrets out of Git." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
