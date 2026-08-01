import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Local Endpoints";

export const AUDIO_SRC = "audio/terraform/032-endpoint-overrides-for-local-apis.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.66;

export const HIGHLIGHT_WORDS = [
  "endpoints",
  "local",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "where API calls go",
  chips: [
    "endpoint",
    "local",
    "verify",
  ],
  lines: [
    "endpoints { ... }",
    "http://localhost",
    "$ terraform plan",
  ],
  bad: "hidden endpoint",
  good: "explicit target",
  stamp: "VERIFY THE ENDPOINT",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How does Terraform talk to a local API?" },
  { id: "explain", text: "An endpoint override tells a provider to send API requests to a different URL instead of its normal cloud service endpoint. This is commonly used for local emulators, private test APIs, or controlled integration environments. It changes where requests go, not what Terraform state means." },
  { id: "detail", text: "Use provider documentation for the exact endpoint override syntax because every provider exposes it differently. Keep local endpoint values in clearly named variables or separate development configuration. Before applying, verify the endpoint, account settings, and resource names from the generated plan." },
  { id: "pitfall", text: "Leaving a local endpoint override enabled can make later tests target the wrong service and produce confusing results. Never point an unknown configuration at a production-like endpoint without a reviewed plan and credentials." },
  { id: "rule", text: "Make endpoint targets explicit, temporary, and easy to verify." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
