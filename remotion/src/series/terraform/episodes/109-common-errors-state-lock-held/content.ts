import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "State locking";

export const AUDIO_SRC = "audio/terraform/109-common-errors-state-lock-held.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.45;

export const HIGHLIGHT_WORDS = [
  "lock",
  "concurrency",
  "backend",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "LOCK",
  chips: [
    "apply",
    "wait",
    "recover",
  ],
  lines: [
    "One state, one writer",
    "Check holder first",
  ],
  bad: "Force unlock first",
  good: "Confirm then recover",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A state lock is Terraform preventing two surgeons from operating together." },
  { id: "explain", text: "A remote state lock prevents concurrent Terraform operations from modifying the same state at the same time. A lock held error usually means another plan or apply is running, a prior process ended unexpectedly, or the backend has not released the lock yet. Treat it as coordination evidence, not annoyance." },
  { id: "detail", text: "Identify the lock holder and check CI runs, terminal sessions, and backend metadata. Wait for a legitimate operation to finish, then retry. If the operation is confirmed dead, use the backend's documented recovery method and record why. Design CI so applies to one state are serialized." },
  { id: "pitfall", text: "Force-unlocking immediately can allow two operations to write conflicting state and cause resource corruption. A lock might belong to a slow but valid apply. Verify the operation is truly inactive, notify the owner, and preserve an audit trail before breaking it." },
  { id: "rule", text: "Verify the holder; force-unlock only confirmed abandoned operations." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
