import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Runbooks";

export const AUDIO_SRC = "audio/terraform/110-runbooks-for-failed-apply.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 69.41;

export const HIGHLIGHT_WORDS = [
  "runbook",
  "recovery",
  "incident",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "RUN",
  chips: [
    "stop",
    "assess",
    "recover",
  ],
  lines: [
    "Capture error",
    "Fresh plan before retry",
  ],
  bad: "Panic retry",
  good: "Guided recovery",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A failed apply needs a playbook before it needs a hero." },
  { id: "explain", text: "A failed apply runbook gives responders a safe sequence for stopping, assessing, recovering, and communicating. It should identify the state backend, affected environment, owners, common failure classes, and escalation paths. The goal is to prevent rushed retries or state edits from making a partial deployment worse." },
  { id: "detail", text: "Include steps to capture the error, check cloud audit events, inspect the current state and remote resources, verify locks, and generate a fresh plan. State when to retry, roll forward, roll back, or escalate. Link backup, import, and state recovery procedures with required approvals." },
  { id: "pitfall", text: "A runbook that says retry apply is dangerous when the failure left partial resources or changed remote configuration. Generic runbooks also fail under pressure. Write concrete commands and decision points, then test them during controlled incidents or game days." },
  { id: "rule", text: "Document safe recovery decisions before the first failed apply." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
