import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Validate Early";

export const AUDIO_SRC = "audio/terraform/018-terraform-validate-catch-syntax-early.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.33;

export const HIGHLIGHT_WORDS = [
  "validate",
  "syntax",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "catch it early",
  chips: [
    "fmt",
    "validate",
    "plan",
  ],
  lines: [
    "$ terraform init",
    "$ terraform validate",
  ],
  bad: "validate = deploy",
  good: "fast feedback",
  stamp: "CHECK BEFORE CLOUD",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Can you catch mistakes before a plan?" },
  { id: "explain", text: "Terraform validate checks whether a configuration is internally consistent and syntactically valid. It catches many malformed blocks, missing required arguments, and invalid references without contacting every cloud API. Run init first because validation needs downloaded provider schemas and modules." },
  { id: "detail", text: "Use terraform validate after terraform fmt and before terraform plan in local work and CI. It is fast feedback for code structure, especially after refactoring variables or modules. Follow it with a plan because validate cannot prove your credentials, permissions, or real cloud changes." },
  { id: "pitfall", text: "A successful validate result does not mean apply will succeed. It cannot predict quota failures, unavailable regions, existing names, external drift, or policy rules enforced by your cloud account." },
  { id: "rule", text: "Validate catches configuration problems; plan checks intended infrastructure changes." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
