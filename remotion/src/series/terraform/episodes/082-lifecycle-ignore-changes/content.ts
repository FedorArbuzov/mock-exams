import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Lifecycle";

export const AUDIO_SRC = "audio/terraform/082-lifecycle-ignore-changes.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 72.17;

export const HIGHLIGHT_WORDS = [
  "drift",
  "ownership",
  "autoscaling",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "SKIP",
  chips: [
    "field",
    "owner",
    "drift",
  ],
  lines: [
    "ignore_changes = [desired_count]",
    "Owner: autoscaler",
  ],
  bad: "Ignore everything",
  good: "Ignore one owned field",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Ignore drift only when you can explain who owns the ignored field." },
  { id: "explain", text: "The lifecycle ignore_changes setting tells Terraform not to reconcile selected attributes after creation. It can help when another approved system manages a field, such as an autoscaler changing desired capacity. The setting transfers ownership; it does not magically make drift harmless." },
  { id: "detail", text: "Name the external owner and limit ignored attributes to the smallest possible set. Review whether Terraform still needs to manage the value when the external integration changes. A comment or module input can make the reason visible. Use data and monitoring to observe the value Terraform intentionally stops correcting." },
  { id: "pitfall", text: "Ignoring all changes hides real configuration drift, security regressions, and accidental console edits. Teams then assume Terraform represents reality when it does not. Do not use ignore_changes just to silence a confusing plan; first identify the competing controller." },
  { id: "rule", text: "Ignore only attributes with a documented external owner." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
