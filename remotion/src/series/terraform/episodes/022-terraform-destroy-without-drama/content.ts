import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Destroy Safely";

export const AUDIO_SRC = "audio/terraform/022-terraform-destroy-without-drama.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 61.61;

export const HIGHLIGHT_WORDS = [
  "destroy",
  "cleanup",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "destroy safely",
  chips: [
    "directory",
    "account",
    "plan",
  ],
  lines: [
    "$ terraform plan -destroy",
    "$ terraform destroy",
  ],
  bad: "wrong state",
  good: "verify first",
  stamp: "DELETE WITH PROOF",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "How do you delete a lab without deleting the wrong thing?" },
  { id: "explain", text: "Terraform destroy plans to remove every managed resource in the current state, then asks for confirmation. It is useful for temporary labs and environments, but it is still a real deletion operation. Resources outside the state are not automatically protected by the command." },
  { id: "detail", text: "Run terraform plan -destroy first and read the target account, region, and resource list. Use a separate sandbox workspace or state for practice environments. After destroying a lab, confirm any provider-side leftovers such as data, logs, or objects with retention settings." },
  { id: "pitfall", text: "Never type destroy in an unfamiliar directory or against an unknown backend. A wrong profile, workspace, or cloud account can turn a cleanup command into a serious incident." },
  { id: "rule", text: "Before destroy, verify the directory, state, account, and plan." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
