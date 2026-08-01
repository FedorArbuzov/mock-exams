import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "State Locking";

export const AUDIO_SRC = "audio/terraform/040-state-locking-with-dynamodb.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 0.36;

export const HIGHLIGHT_WORDS = [
  "locking",
  "DynamoDB",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "one apply at once",
  chips: [
    "S3",
    "lock",
    "DynamoDB",
  ],
  lines: [
    "apply A: lock",
    "apply B: waits",
    "terraform force-unlock",
  ],
  bad: "two applies",
  good: "one lock",
  stamp: "LOCK BEFORE WRITING STATE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What stops two applies colliding?" },
  { id: "explain", text: "State locking prevents concurrent Terraform operations from writing the same state at the same time. In the traditional S3 backend pattern, DynamoDB provides a lock record while Terraform plans or applies. The second operation waits or fails rather than proceeding from a stale shared state snapshot." },
  { id: "detail", text: "Create and configure the lock table according to the backend documentation, then ensure every team member and CI job uses the same backend settings. If a lock remains after a crash, investigate the active operation before force-unlocking. Treat lock identifiers as evidence, not obstacles." },
  { id: "pitfall", text: "Never force-unlock just because you are waiting. You can corrupt state coordination if another apply is still running. Confirm the original process has stopped and identify the exact lock first." },
  { id: "rule", text: "A state lock protects the team from simultaneous, conflicting infrastructure changes." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
