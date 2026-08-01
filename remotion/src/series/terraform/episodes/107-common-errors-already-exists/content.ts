import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Troubleshooting";

export const AUDIO_SRC = "audio/terraform/107-common-errors-already-exists.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.30;

export const HIGHLIGHT_WORDS = [
  "import",
  "ownership",
  "state",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "EXISTS",
  chips: [
    "cloud",
    "state",
    "owner",
  ],
  lines: [
    "Resource exists remotely",
    "Decide authoritative owner",
  ],
  bad: "Retry or delete blindly",
  good: "Reconcile ownership",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Already exists usually means Terraform and the cloud disagree about ownership." },
  { id: "explain", text: "An already exists error occurs when Terraform tries to create an object whose unique name or identifier is already present in the cloud. The object may have been created manually, by another state, or by a previous failed workflow. Do not retry blindly; first determine who should manage it." },
  { id: "detail", text: "Inspect the remote resource, its tags, and all relevant Terraform states. If this configuration should own the existing object, import it and align code with reality. If another system owns it, choose a different name or reference it as external. Verify no concurrent deployment is creating it." },
  { id: "pitfall", text: "Deleting the existing object to make Terraform happy can destroy live data or another team's infrastructure. Importing blindly is also risky when ownership is unclear. Establish the authoritative state and lifecycle before changing anything in production." },
  { id: "rule", text: "Resolve ownership first; import, rename, or reference deliberately." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
