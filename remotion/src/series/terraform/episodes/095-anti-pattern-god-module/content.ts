import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module design";

export const AUDIO_SRC = "audio/terraform/095-anti-pattern-god-module.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.06;

export const HIGHLIGHT_WORDS = [
  "coupling",
  "cohesion",
  "interfaces",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SPLIT",
  chips: [
    "network",
    "db",
    "app",
  ],
  lines: [
    "Small modules connect",
    "One concern each",
  ],
  bad: "One module does all",
  good: "Focused responsibilities",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "If one module creates everything, no team can change anything confidently." },
  { id: "explain", text: "A god module combines unrelated concerns such as networks, databases, compute, monitoring, identities, and policies behind one enormous interface. It appears convenient at first but creates tightly coupled changes, slow releases, and confusing plans. Consumers cannot adopt or upgrade one capability independently." },
  { id: "detail", text: "Split modules along stable responsibility boundaries and connect them through clear outputs. Keep a higher-level composition module only where a complete stack is genuinely standardized. Give each module a small documented contract, focused tests, and an owner who understands its domain." },
  { id: "pitfall", text: "Replacing a god module with dozens of tiny wrappers is not improvement. The goal is cohesive responsibility, not maximum file count. If inputs always change together and have one owner, they may belong together; otherwise separate the concerns." },
  { id: "rule", text: "Design modules around cohesive responsibilities and independent change." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
