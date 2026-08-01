import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "state list";

export const AUDIO_SRC = "audio/terraform/041-terraform-state-list.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 67.25;

export const HIGHLIGHT_WORDS = [
  "state",
  "addresses",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "INVENTORY",
  chips: [
    "state",
    "addresses",
    "safe",
  ],
  lines: [
    "$ terraform state list",
  ],
  bad: "Guess address",
  good: "Copy address",
  stamp: "READ FIRST",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What does Terraform think it owns right now?" },
  { id: "explain", text: "terraform state list prints every resource address stored in the current state. It does not query the cloud, change infrastructure, or inspect your configuration. Use it to understand Terraform's current inventory before debugging, importing, moving resources, or removing stale records." },
  { id: "detail", text: "Addresses can include modules, indexes, and for_each keys, such as module.network.aws_subnet.private[\"app-a\"]. The exact address matters because state commands operate on it. Run the command against the correct workspace and backend, then copy addresses carefully instead of guessing them." },
  { id: "pitfall", text: "A listed resource is not proof that it still exists in the provider. State can be stale after manual deletion or failed automation. Conversely, an existing cloud resource will not appear until Terraform manages it or you import it." },
  { id: "rule", text: "List state first, then make state changes using exact addresses." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
