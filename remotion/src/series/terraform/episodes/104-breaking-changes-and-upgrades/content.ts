import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Upgrades";

export const AUDIO_SRC = "audio/terraform/104-breaking-changes-and-upgrades.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.40;

export const HIGHLIGHT_WORDS = [
  "providers",
  "modules",
  "migration",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "UP",
  chips: [
    "notes",
    "test",
    "plan",
  ],
  lines: [
    "pin -> upgrade -> review",
    "one dependency class",
  ],
  bad: "Upgrade during feature",
  good: "Dedicated upgrade change",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "An upgrade is a change project when the compatibility contract moves." },
  { id: "explain", text: "Terraform, providers, and modules evolve through releases that can change defaults, remove fields, alter state behavior, or require replacement. Treat upgrades as planned work: read release notes, identify breaking changes, update constraints, and inspect plans in a safe environment before changing production." },
  { id: "detail", text: "Upgrade one major dependency class at a time where possible. Test representative roots, run validation and plans, and capture migration instructions in the pull request. Keep rollback options, backups, and a known prior version. Schedule larger upgrades when owners can respond to unexpected behavior." },
  { id: "pitfall", text: "Running a broad upgrade command during an unrelated feature change mixes risk and makes failures hard to diagnose. Skipping many versions can also compound migrations. Pin dependencies, upgrade deliberately, and make the resulting plan the central review artifact." },
  { id: "rule", text: "Upgrade deliberately, read changelogs, and test plans before production." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
