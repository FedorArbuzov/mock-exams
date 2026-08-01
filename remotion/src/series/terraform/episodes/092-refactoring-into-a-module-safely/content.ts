import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module refactoring";

export const AUDIO_SRC = "audio/terraform/092-refactoring-into-a-module-safely.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.35;

export const HIGHLIGHT_WORDS = [
  "moved",
  "state",
  "addresses",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "MOVE",
  chips: [
    "old",
    "map",
    "new",
  ],
  lines: [
    "moved { from = aws_s3_bucket.x",
    "to = module.logs.aws_s3_bucket.this }",
  ],
  bad: "Destroy and recreate",
  good: "Preserve remote object",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Refactoring Terraform safely means preserving addresses, not just code behavior." },
  { id: "explain", text: "Moving existing resources into a module changes their Terraform addresses. Without guidance, Terraform may plan to destroy the old addresses and create new ones. Use moved blocks, or carefully planned state moves, to tell Terraform that the resource has relocated logically but should remain the same remote object." },
  { id: "detail", text: "First create the module with equivalent arguments and outputs. Add moved blocks that map each old address to its new module address, then inspect the plan for zero unintended resource actions. Test the migration in a non-production state copy and commit the refactor separately from functional changes." },
  { id: "pitfall", text: "Combining a module extraction with resource renames, provider upgrades, and behavior changes makes the plan impossible to audit. A state move typed incorrectly can also create risky actions. Keep the first refactor mechanical, review every address, and change behavior later." },
  { id: "rule", text: "Map old addresses to new module addresses before apply." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
