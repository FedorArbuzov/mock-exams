import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "security groups";

export const AUDIO_SRC = "audio/terraform/073-security-groups-as-code.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.89;

export const HIGHLIGHT_WORDS = [
  "security groups",
  "network",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "FIREWALL",
  chips: [
    "port",
    "source",
    "least",
  ],
  lines: [
    "app SG -> db SG : 5432",
  ],
  bad: "Open database",
  good: "Group source",
  stamp: "ALLOW MINIMALLY",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Security groups are stateful traffic rules attached to workloads." },
  { id: "explain", text: "AWS security groups control allowed inbound and outbound traffic for attached network interfaces. Terraform expresses their rules as reviewed code, making intended ports, protocols, CIDRs, and source groups visible. Security groups are stateful, so return traffic is handled differently from stateless network ACLs." },
  { id: "detail", text: "Prefer narrowly scoped rules that reference another security group when traffic is between application tiers. Name rules or resources clearly and document unusual ports. Separate reusable group definitions from application-specific attachments when that improves ownership and review clarity." },
  { id: "pitfall", text: "A broad 0.0.0.0/0 rule can be necessary for a public endpoint but is dangerous for administration or databases. Mixing inline and separate rule resources can cause management conflicts. Security group rules do not replace authentication, authorization, or host hardening." },
  { id: "rule", text: "Allow the smallest required traffic path and review every broad rule." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
