import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Inside State";

export const AUDIO_SRC = "audio/terraform/037-what-lives-inside-terraform-tfstate.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.66;

export const HIGHLIGHT_WORDS = [
  "state",
  "resources",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "inside state",
  chips: [
    "IDs",
    "attrs",
    "links",
  ],
  lines: [
    "$ terraform show",
    "$ terraform state list",
    "resource address",
  ],
  bad: "edit raw JSON",
  good: "inspect safely",
  stamp: "STATE TRACKS OBJECTS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What is actually inside a state file?" },
  { id: "explain", text: "A Terraform state file records managed resource instances, their addresses, provider associations, dependencies, identifiers, and many observed attributes. Terraform uses this information to compare declared configuration with existing infrastructure. State is implementation data, not a hand-written inventory document or a source file." },
  { id: "detail", text: "Use terraform show to inspect state in a readable form and terraform state list to see managed addresses. Avoid opening or editing raw state unless you are diagnosing a specific advanced problem. Back up remote state and restrict access because its contents can be operationally sensitive." },
  { id: "pitfall", text: "State does not automatically contain every resource in your cloud account. It tracks only objects Terraform manages in that state, plus data it needs for those objects and referenced data sources." },
  { id: "rule", text: "State tracks Terraform-managed reality, not your entire cloud universe." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
