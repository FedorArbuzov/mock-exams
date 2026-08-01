import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "drift";

export const AUDIO_SRC = "audio/terraform/044-drift-console-changed-it-terraform-notices.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 66.02;

export const HIGHLIGHT_WORDS = [
  "drift",
  "console",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "DRIFT",
  chips: [
    "console",
    "plan",
    "decide",
  ],
  lines: [
    "Console change -> plan diff",
  ],
  bad: "Auto revert",
  good: "Understand why",
  stamp: "CODE DECIDES",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Someone clicked a console setting. Terraform can see it." },
  { id: "explain", text: "Drift happens when real infrastructure differs from Terraform state or configuration, often after console changes, scripts, or provider defaults. During planning, Terraform refreshes relevant remote objects and can propose changes that return them to the declared configuration." },
  { id: "detail", text: "Treat a drifted plan as information before treating it as a repair command. Identify who changed the resource, why it changed, and whether configuration should adopt the new value. Then either update code intentionally or apply a reviewed plan to restore it." },
  { id: "pitfall", text: "Not every plan difference is harmful drift. Provider upgrades, computed attributes, and changing defaults can also create differences. Ignoring every plan trains teams to miss meaningful manual changes, while automatically applying can undo an emergency production adjustment." },
  { id: "rule", text: "Investigate drift, choose the desired source of truth, then apply." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
