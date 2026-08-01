import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Provider Aliases";

export const AUDIO_SRC = "audio/terraform/028-multiple-providers-aliases.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 63.91;

export const HIGHLIGHT_WORDS = [
  "aliases",
  "multi-region",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "two targets",
  chips: [
    "default",
    "alias",
    "explicit",
  ],
  lines: [
    "provider \"aws\"",
    "alias = \"west\"",
    "provider = aws.west",
  ],
  bad: "wrong default",
  good: "explicit target",
  stamp: "ALIAS THE TARGET",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Can one Terraform project target two regions?" },
  { id: "explain", text: "Provider aliases let one configuration use multiple instances of the same provider with different settings. For AWS, that can mean separate regions, accounts, or assumed roles. Resources select a non-default provider explicitly, while resources without a provider setting use the default instance." },
  { id: "detail", text: "Define one default provider and give additional instances clear aliases such as west or audit. Set provider = aws.west on the resource or pass an aliased provider into a module. Document the purpose of every alias so reviewers can spot cross-account changes." },
  { id: "pitfall", text: "An alias declaration alone does nothing unless resources or modules reference it. A missing provider assignment can quietly send a resource to the default account or region instead of the intended target." },
  { id: "rule", text: "Use clear aliases whenever a project controls more than one target." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
