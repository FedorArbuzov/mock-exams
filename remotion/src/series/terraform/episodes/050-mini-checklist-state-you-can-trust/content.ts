import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "trusted state";

export const AUDIO_SRC = "audio/terraform/050-mini-checklist-state-you-can-trust.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.53;

export const HIGHLIGHT_WORDS = [
  "state",
  "locking",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "TRUST",
  chips: [
    "remote",
    "locked",
    "encrypted",
  ],
  lines: [
    "backend + lock + plan",
  ],
  bad: "Local shared file",
  good: "Protected backend",
  stamp: "STATE CHECK",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Trustworthy state is protected, current, and understood." },
  { id: "explain", text: "Healthy Terraform state uses a remote backend, access controls, encryption, version history, and locking where supported. Teams know which workspace and account they are operating in. Plans are reviewed, state edits are rare, and no one treats local state files as shared truth." },
  { id: "detail", text: "Before a risky change, confirm backend, workspace, cloud identity, and lock behavior. Use terraform state list for inventory and terraform plan for consequences. Keep state recovery procedures tested, because state is a critical record of Terraform ownership rather than disposable cache." },
  { id: "pitfall", text: "State can contain credentials and sensitive resource data, even when output is marked sensitive. Sending it through chat, committing it, or copying it to personal storage is an exposure. Remote storage needs least privilege and audited access." },
  { id: "rule", text: "Protect state like production data and verify it before changes." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
