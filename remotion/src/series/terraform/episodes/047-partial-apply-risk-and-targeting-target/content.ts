import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "targeting";

export const AUDIO_SRC = "audio/terraform/047-partial-apply-risk-and-targeting-target.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 62.95;

export const HIGHLIGHT_WORDS = [
  "target",
  "risk",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SCALPEL",
  chips: [
    "exception",
    "review",
    "full plan",
  ],
  lines: [
    "$ terraform plan -target=aws_instance.app",
  ],
  bad: "Routine CI",
  good: "Emergency repair",
  stamp: "EXCEPTIONS ONLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "dash target is a scalpel, not a deployment strategy." },
  { id: "explain", text: "The -target option limits planning and applying to selected addresses and their dependencies. It can help recover from exceptional failures or isolate a specific repair. It intentionally bypasses Terraform's normal view of the complete desired infrastructure graph." },
  { id: "detail", text: "Use terraform plan -target only when you can explain why a full plan is unsafe or impossible. Review the warning and follow with a normal plan after the targeted change. The full plan confirms that unrelated dependencies remain consistent." },
  { id: "pitfall", text: "Regular targeted applies create partial updates and hide changes outside the selected path. Teams may think a deployment succeeded while an output, policy, or dependent resource remains outdated. Do not put targeting into routine CI deployment commands." },
  { id: "rule", text: "Use dash target for recovery, then run a full plan." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
