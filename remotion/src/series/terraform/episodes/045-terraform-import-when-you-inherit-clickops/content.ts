import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "import";

export const AUDIO_SRC = "audio/terraform/045-terraform-import-when-you-inherit-clickops.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.68;

export const HIGHLIGHT_WORDS = [
  "import",
  "clickops",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "ADOPT",
  chips: [
    "code",
    "import",
    "plan",
  ],
  lines: [
    "$ terraform import aws_s3_bucket.logs my-logs",
  ],
  bad: "State only",
  good: "Code first",
  stamp: "ADOPT SAFELY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An existing resource can join Terraform without recreation." },
  { id: "explain", text: "terraform import connects an existing provider object to a resource address in Terraform state. It is useful when inheriting manually created infrastructure. Import does not generate complete configuration and does not change the remote object by itself." },
  { id: "detail", text: "Write a matching resource block first, discover the provider import identifier, and import into the exact address. Immediately run terraform plan. Keep adjusting configuration until the plan shows no unwanted replacement or changes before treating the resource as managed." },
  { id: "pitfall", text: "Importing only state without matching code creates a dangerous next plan. Terraform may propose changing or replacing the resource to satisfy incomplete defaults. Import one related component at a time and record identifiers that are difficult to rediscover." },
  { id: "rule", text: "Import into matching code, then require a quiet plan." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
