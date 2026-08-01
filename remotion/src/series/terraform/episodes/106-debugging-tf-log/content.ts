import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Debugging";

export const AUDIO_SRC = "audio/terraform/106-debugging-tf-log.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 73.66;

export const HIGHLIGHT_WORDS = [
  "TF_LOG",
  "TRACE",
  "diagnostics",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "DEBUG",
  chips: [
    "INFO",
    "DEBUG",
    "TRACE",
  ],
  lines: [
    "TF_LOG=DEBUG",
    "TF_LOG_PATH=terraform.log",
  ],
  bad: "Permanent noisy trace",
  good: "Targeted protected logs",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "When Terraform is mysterious, turn on evidence before guessing." },
  { id: "explain", text: "TF_LOG enables Terraform diagnostic logs at levels such as ERROR, WARN, INFO, DEBUG, and TRACE. It can reveal provider requests, dependency evaluation, and backend behavior that normal output hides. Use the lowest useful level and direct logs to a protected file when investigating a specific issue." },
  { id: "detail", text: "Set TF_LOG temporarily for one reproduction, capture the relevant time window, then remove it. TF_LOG_PATH can keep verbose output out of the terminal. Redact and restrict logs because debug output may contain sensitive resource details, tokens, or configuration values depending on the provider and operation." },
  { id: "pitfall", text: "Leaving TRACE logging enabled in CI creates huge noisy logs and may expose data to people who do not need it. Debug logs are not a substitute for reading the plan or error message. Start narrow, reproduce once, and protect the output." },
  { id: "rule", text: "Enable targeted logs briefly and handle their contents as sensitive." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
