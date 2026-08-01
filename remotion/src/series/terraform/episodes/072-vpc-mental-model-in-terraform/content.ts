import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "VPC model";

export const AUDIO_SRC = "audio/terraform/072-vpc-mental-model-in-terraform.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.37;

export const HIGHLIGHT_WORDS = [
  "VPC",
  "networking",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "VPC",
  chips: [
    "CIDR",
    "subnet",
    "route",
  ],
  lines: [
    "VPC -> subnet -> route table",
  ],
  bad: "Name implies public",
  good: "Route proves path",
  stamp: "TRACE TRAFFIC",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A VPC is address space plus routing and boundaries." },
  { id: "explain", text: "A VPC defines an isolated network with a CIDR range. Subnets divide that range across availability zones. Route tables decide traffic paths, internet gateways provide public internet paths, and NAT gateways let private workloads reach outward without accepting inbound internet traffic." },
  { id: "detail", text: "In Terraform, model the network in layers: VPC, subnets, gateways, route tables, associations, and security controls. Use clear maps keyed by availability zone or purpose. Plan CIDR ranges early because changing foundational network addresses later is disruptive." },
  { id: "pitfall", text: "Calling a subnet public because it has a public-looking name is not enough. Public routing and public IP assignment determine behavior. NAT gateways have cost and availability implications. Avoid copying a large network module until you can explain each route." },
  { id: "rule", text: "Model VPCs as CIDRs, subnets, routes, and explicit traffic paths." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
