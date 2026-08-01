import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Keys and State";

export const AUDIO_SRC = "audio/terraform/034-myth-terraform-stores-your-aws-keys-in-state-nuance.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.42;

export const HIGHLIGHT_WORDS = [
  "state",
  "secrets",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "keys in state?",
  chips: [
    "state",
    "values",
    "protect",
  ],
  lines: [
    "sensitive = true",
    "remote backend",
    "access control",
  ],
  bad: "state is public",
  good: "state protected",
  stamp: "STATE MAY HOLD SECRETS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Are AWS keys always written into state?" },
  { id: "explain", text: "Terraform state stores resource data that providers return and Terraform needs to track, not a deliberate copy of your AWS provider credentials. However, state can contain sensitive values from resource arguments or API responses. Marking an output sensitive hides it in normal CLI display but does not encrypt state by itself." },
  { id: "detail", text: "Use remote state with strict access control, encryption, versioning, and audit logs. Review provider and resource documentation to learn which values can enter state. Prefer secret references or managed secret services over passing secret strings directly into Terraform resource arguments whenever possible." },
  { id: "pitfall", text: "The myth becomes dangerous when it makes teams ignore state security. State may not hold your login keys, but it can still expose passwords, tokens, connection details, and valuable infrastructure metadata." },
  { id: "rule", text: "Protect state as sensitive data, even when credentials are not directly stored." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
