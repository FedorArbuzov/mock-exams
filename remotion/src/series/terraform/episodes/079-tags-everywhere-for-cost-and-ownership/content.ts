import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Resource tags";

export const AUDIO_SRC = "audio/terraform/079-tags-everywhere-for-cost-and-ownership.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 74.06;

export const HIGHLIGHT_WORDS = [
  "cost",
  "owner",
  "environment",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "TAG",
  chips: [
    "owner",
    "env",
    "cost",
  ],
  lines: [
    "tags = local.common_tags",
    "owner = \"payments\"",
  ],
  bad: "Random tag spelling",
  good: "Required shared tags",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An untagged resource becomes an orphan the moment its creator leaves." },
  { id: "explain", text: "Tags attach searchable business context to cloud resources. Common tags include environment, application, owner, cost center, and managed-by. Define shared tags once in Terraform and merge them with resource-specific tags. This makes cost reports, ownership questions, automation, and cleanup much more reliable." },
  { id: "detail", text: "Use a small required tag set that teams can actually maintain. Apply it to resources that support tags, including log groups and networking components where practical. Provider default tags can reduce repetition, while explicit tags document exceptions. Keep values predictable so reporting tools do not split equivalent categories." },
  { id: "pitfall", text: "Tags typed by hand drift into variants like prod, production, and Production. Cost allocation then becomes misleading. Another mistake is treating tags as decoration; they should answer who owns this, why it exists, and which budget absorbs it." },
  { id: "rule", text: "Standardize required tags and apply them through Terraform defaults." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
