import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "State design";

export const AUDIO_SRC = "audio/terraform/101-separate-states-per-env.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 75.00;

export const HIGHLIGHT_WORDS = [
  "state",
  "environments",
  "isolation",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "STATE",
  chips: [
    "dev",
    "stage",
    "prod",
  ],
  lines: [
    "dev.tfstate",
    "prod.tfstate",
  ],
  bad: "One state for all",
  good: "Isolated environment state",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "One giant state makes a dev change wait behind production." },
  { id: "explain", text: "Separate Terraform state per environment limits blast radius, contention, and accidental cross-environment changes. Development, staging, and production can use the same modules with different roots, variables, accounts, or backend keys. Each state becomes a focused record of one deployment boundary and its managed objects." },
  { id: "detail", text: "Choose state boundaries around independent ownership, lifecycle, and apply cadence, not just naming preference. Use remote backends with locking and access control. Keep production credentials and state access more restricted than development. Share values between states only through deliberate outputs, data sources, or published interfaces." },
  { id: "pitfall", text: "Splitting state too aggressively creates a web of hidden dependencies and difficult ordering. Keeping every environment together creates lock contention and broad access. Start with clear environment boundaries, then split further only when ownership or deployment cadence truly differs." },
  { id: "rule", text: "Align state boundaries with environment, ownership, and change cadence." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
