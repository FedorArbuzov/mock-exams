import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "backend migrate";

export const AUDIO_SRC = "audio/terraform/049-backend-migrate-without-panic.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.14;

export const HIGHLIGHT_WORDS = [
  "backend",
  "migration",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "MOVE STATE",
  chips: [
    "pause",
    "init",
    "verify",
  ],
  lines: [
    "$ terraform init",
  ],
  bad: "Two writers",
  good: "One authority",
  stamp: "MIGRATE CALMLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Moving state is routine only when you protect the source." },
  { id: "explain", text: "Changing backend configuration can move Terraform state from one storage location to another. terraform init detects the change and offers migration. This operation changes where the authoritative state lives, so perform it deliberately with access, locking, and backup verified." },
  { id: "detail", text: "Pause concurrent applies, commit backend configuration, and confirm credentials for both old and new locations. Run terraform init and choose migration only after reading the prompt. Then verify state listing, workspace selection, and a no-change plan using the new backend." },
  { id: "pitfall", text: "Do not run backend migration from an unreviewed local configuration or while another pipeline may write state. Split-brain state causes conflicting resource ownership. A successful init alone is not enough; verify the expected remote state and locking behavior." },
  { id: "rule", text: "Pause writers, migrate once, then verify state and locking." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
