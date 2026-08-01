import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "outputs";

export const AUDIO_SRC = "audio/terraform/056-outputs-for-humans-and-other-stacks.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.70;

export const HIGHLIGHT_WORDS = [
  "outputs",
  "contracts",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "RESULT",
  chips: [
    "URL",
    "ID",
    "contract",
  ],
  lines: [
    "output \"api_url\" {}",
  ],
  bad: "Expose all",
  good: "Useful contract",
  stamp: "PUBLISH INTENTIONALLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Outputs are your configuration's public results." },
  { id: "explain", text: "Output values expose useful results after apply, such as service URLs, resource IDs, or connection endpoints. Humans can read them, and other Terraform configurations can consume remote state outputs. Treat outputs as a deliberate contract between a module and its users." },
  { id: "detail", text: "Give outputs stable names and descriptions, and expose only values consumers need. Mark secret outputs sensitive so normal CLI display is redacted. For cross-stack use, prefer small, documented outputs over allowing another stack to depend on every internal resource." },
  { id: "pitfall", text: "Sensitive outputs still exist in state, and remote-state readers may access them depending on backend permissions. Do not use outputs as a general secret-sharing system. Changing or removing a widely consumed output is an interface-breaking change." },
  { id: "rule", text: "Publish stable, minimal outputs and secure access to their state." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
