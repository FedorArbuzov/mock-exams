import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module checklist";

export const AUDIO_SRC = "audio/terraform/096-mini-checklist-modules-that-help.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.28;

export const HIGHLIGHT_WORDS = [
  "checklist",
  "testing",
  "ownership",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "CHECK",
  chips: [
    "small API",
    "owner",
    "examples",
  ],
  lines: [
    "Repeated intent?",
    "Safe upgrades?",
  ],
  bad: "Opaque shared wrapper",
  good: "Focused supported module",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A helpful module makes callers simpler, safer, and easier to review." },
  { id: "explain", text: "Before adopting or publishing a module, check that it represents a repeated pattern, has a small typed interface, exposes useful outputs, and documents examples. Confirm it has a version strategy, clear owner, and sensible secure defaults. Its plan should be understandable without reading every internal file." },
  { id: "detail", text: "Also review whether callers can upgrade safely, whether resource names and tags remain customizable, and whether the module hides important lifecycle choices. Test at least one realistic example. A module should reduce duplication while preserving enough visibility for platform and application teams to operate it." },
  { id: "pitfall", text: "A module can be popular and still harmful if it forces every caller into the same unsuitable assumptions. Do not measure success by adoption alone. Measure whether it reduces repeated mistakes, review time, and maintenance while keeping changes understandable." },
  { id: "rule", text: "Keep module contracts small, owned, tested, and upgradeable." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
