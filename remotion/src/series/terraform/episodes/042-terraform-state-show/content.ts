import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "state show";

export const AUDIO_SRC = "audio/terraform/042-terraform-state-show.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.47;

export const HIGHLIGHT_WORDS = [
  "state",
  "inspect",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "ONE RECORD",
  chips: [
    "address",
    "attributes",
    "read",
  ],
  lines: [
    "$ terraform state show aws_s3_bucket.logs",
  ],
  bad: "Paste config",
  good: "Inspect data",
  stamp: "STATE VIEW",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Need the facts Terraform saved for one resource?" },
  { id: "explain", text: "terraform state show displays the attributes Terraform has recorded for one resource address. It is a local view of state, not a fresh provider read. It helps you inspect identifiers, dependencies, computed values, and the arguments Terraform believes were applied." },
  { id: "detail", text: "Pass one exact address from terraform state list. The output is formatted like configuration, but it represents stored data and may contain sensitive values. Compare important fields with the provider console only when diagnosing drift or unexpected plans." },
  { id: "pitfall", text: "Do not copy state show output directly into configuration. Many fields are computed, provider-specific, or obsolete. Also avoid sharing its output in tickets because state commonly includes secret values, resource IDs, and internal network details." },
  { id: "rule", text: "Use state show to inspect records, never as configuration source." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
