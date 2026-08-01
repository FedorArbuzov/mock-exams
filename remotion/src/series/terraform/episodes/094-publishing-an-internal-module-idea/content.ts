import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Internal modules";

export const AUDIO_SRC = "audio/terraform/094-publishing-an-internal-module-idea.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.81;

export const HIGHLIGHT_WORDS = [
  "internal",
  "registry",
  "maintainers",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SHIP",
  chips: [
    "owner",
    "docs",
    "release",
  ],
  lines: [
    "private registry",
    "CHANGELOG + examples",
  ],
  bad: "Unowned shared code",
  good: "Supported internal product",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An internal module is a product for your own engineers." },
  { id: "explain", text: "Publishing an internal module means offering a supported Terraform building block through a private registry or approved Git source. It should solve a repeated organizational need with a documented interface, examples, versioned releases, and named maintainers. Treat consumers as customers who need predictable upgrades." },
  { id: "detail", text: "Start with a narrow module that already has real callers. Add automated formatting, validation, tests where practical, examples, changelog entries, and security review for defaults. Define support expectations and deprecation policy before broad adoption. Publish only after the contract is stable enough to maintain." },
  { id: "pitfall", text: "Publishing a private module too early turns an experiment into a compatibility burden. A module with no owner, examples, or release notes creates more support work than copy-paste. Internal does not mean undocumented; discoverability and trust still matter." },
  { id: "rule", text: "Publish narrow, owned modules with releases and examples." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
