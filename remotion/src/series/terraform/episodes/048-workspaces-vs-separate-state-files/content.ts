import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "workspaces";

export const AUDIO_SRC = "audio/terraform/048-workspaces-vs-separate-state-files.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.68;

export const HIGHLIGHT_WORDS = [
  "workspace",
  "state",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "BOUNDARY",
  chips: [
    "similar",
    "state",
    "isolation",
  ],
  lines: [
    "$ terraform workspace select dev",
  ],
  bad: "Security boundary",
  good: "State selector",
  stamp: "CHOOSE ISOLATION",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A workspace changes state selection, not architecture." },
  { id: "explain", text: "Terraform workspaces let one configuration use multiple state instances through a selected workspace name. They can suit similar lightweight environments. Separate state files and directories create clearer boundaries when environments require different accounts, permissions, variables, or deployment processes." },
  { id: "detail", text: "Workspaces are convenient for small, nearly identical stacks, but configuration still needs careful environment inputs. For production boundaries, separate backend keys, account credentials, and root modules are often easier to reason about. Choose based on isolation, not convenience alone." },
  { id: "pitfall", text: "A workspace is not a security boundary. Accidentally selecting production can still run production credentials and backend state. Do not use workspace names as the only distinction between drastically different networking, access control, or compliance requirements." },
  { id: "rule", text: "Use workspaces for similar stacks; isolate production with stronger boundaries." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
