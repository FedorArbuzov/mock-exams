import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Provider Versions";

export const AUDIO_SRC = "audio/terraform/030-provider-version-constraints-5-0.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 62.50;

export const HIGHLIGHT_WORDS = [
  "versions",
  "constraints",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "safe upgrades",
  chips: [
    "range",
    "lock",
    "test",
  ],
  lines: [
    "version = \"~> 5.0\"",
    "terraform init -upgrade",
  ],
  bad: "unbounded update",
  good: "tested range",
  stamp: "CONSTRAIN THEN TEST",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How do you allow safe provider updates?" },
  { id: "explain", text: "A pessimistic constraint accepts compatible updates while setting a clear upper boundary. For example, a provider version policy can allow updates within a chosen major-version family but block the next major version. This reduces surprise while still allowing bug fixes and minor improvements." },
  { id: "detail", text: "Write a version constraint in required_providers, commit the resulting lock file, and upgrade deliberately in a test branch. Read provider release notes before changing the allowed range. The exact selected version comes from the lock file until you intentionally run an upgrade." },
  { id: "pitfall", text: "A version constraint is not a promise that every permitted update is harmless. Providers can change defaults or deprecate arguments in minor releases, so review plans and test upgrades before merging." },
  { id: "rule", text: "Constrain provider upgrades, lock selections, and upgrade only with review." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
