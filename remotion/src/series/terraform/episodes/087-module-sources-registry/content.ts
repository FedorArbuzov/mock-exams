import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module registry";

export const AUDIO_SRC = "audio/terraform/087-module-sources-registry.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.83;

export const HIGHLIGHT_WORDS = [
  "registry",
  "versions",
  "reuse",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "REG",
  chips: [
    "publish",
    "version",
    "consume",
  ],
  lines: [
    "source = \"org/vpc/aws\"",
    "version = \"1.4.0\"",
  ],
  bad: "Unpinned remote code",
  good: "Versioned shared module",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A registry module gives reuse a versioned address." },
  { id: "explain", text: "The Terraform Registry, including private registries, distributes modules through a structured source address and version constraint. A registry module lets many repositories consume a documented implementation without copying its code. Terraform downloads the selected version during initialization and records it in dependency metadata." },
  { id: "detail", text: "Choose a namespace, module name, and provider that describe the module purpose. Publish releases with changelogs and examples so consumers can upgrade intentionally. Private registries are especially useful for organization-specific standards, such as approved networking, logging, or account-baseline modules." },
  { id: "pitfall", text: "Pointing at a registry module without a version constraint can unexpectedly consume a newer release on the next initialization. A registry is also not a reason to expose every internal implementation detail. Preserve a small contract and document supported upgrade paths." },
  { id: "rule", text: "Use registry modules for versioned, cross-repository reuse." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
