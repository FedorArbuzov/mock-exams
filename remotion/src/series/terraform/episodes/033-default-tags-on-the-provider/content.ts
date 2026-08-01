import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Default Tags";

export const AUDIO_SRC = "audio/terraform/033-default-tags-on-the-provider.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.83;

export const HIGHLIGHT_WORDS = [
  "tags",
  "governance",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "tag by default",
  chips: [
    "owner",
    "env",
    "cost",
  ],
  lines: [
    "default_tags {",
    "Environment = \"dev\"",
    "ManagedBy = \"Terraform\"",
  ],
  bad: "untagged cloud",
  good: "shared defaults",
  stamp: "TAGS CREATE CONTEXT",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How do you tag every AWS resource?" },
  { id: "explain", text: "The AWS provider can apply default tags to supported resources, reducing repeated tag blocks across configuration. Common defaults include environment, owner, project, cost center, and managed-by. Resource-specific tags can add to or override defaults according to provider behavior." },
  { id: "detail", text: "Define stable organization-wide defaults in the provider and keep application-specific tags near each resource. Use a consistent tag vocabulary so billing, inventory, and automation can query it. Review plans after changing defaults because one provider edit can affect many resources." },
  { id: "pitfall", text: "Default tags do not guarantee every AWS resource supports tags in the same way. Do not put secrets or personal data in tags because tags are broadly visible through cloud APIs and billing tools." },
  { id: "rule", text: "Set useful defaults once, then tag exceptions intentionally per resource." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
