import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Lifecycle";

export const AUDIO_SRC = "audio/terraform/083-create-before-destroy.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.65;

export const HIGHLIGHT_WORDS = [
  "replacement",
  "downtime",
  "quota",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SWAP",
  chips: [
    "new",
    "switch",
    "old",
  ],
  lines: [
    "create_before_destroy = true",
    "new -> redirect -> delete",
  ],
  bad: "Delete then create",
  good: "Create then switch",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Replacement does not have to mean downtime." },
  { id: "explain", text: "The create_before_destroy lifecycle setting changes replacement order: Terraform attempts to create the new object before removing the old one. It is useful for resources where continuity matters, such as launch templates, security group replacements, or load balancer components. Whether it works depends on service constraints and naming." },
  { id: "detail", text: "Confirm that the provider can temporarily hold both resources and that names, quotas, and dependencies allow overlap. Downstream references must switch to the new resource before the old one disappears. Test this behavior in a non-production environment because replacement graphs can become more complex than expected." },
  { id: "pitfall", text: "Using a fixed unique name can make create_before_destroy impossible because AWS will reject a duplicate. The plan may still show replacement, but creation fails first. Use generated suffixes or naming patterns where safe, and verify quota headroom." },
  { id: "rule", text: "Use overlap only when names, quotas, and dependencies permit it." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
