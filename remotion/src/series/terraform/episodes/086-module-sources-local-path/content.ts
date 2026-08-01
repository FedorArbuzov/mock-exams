import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module sources";

export const AUDIO_SRC = "audio/terraform/086-module-sources-local-path.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 70.37;

export const HIGHLIGHT_WORDS = [
  "local",
  "source",
  "repository",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "PATH",
  chips: [
    "root",
    "modules",
    "local",
  ],
  lines: [
    "source = \"./modules/vpc\"",
    "module \"vpc\"",
  ],
  bad: "Machine-specific path",
  good: "Relative module path",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "A local module is the fastest way to share code inside one repository." },
  { id: "explain", text: "A local module source points to a directory in the same repository, usually with a relative path such as ./modules/network. It is ideal while developing a pattern alongside its callers. Terraform reads the module code from that path during initialization and plans." },
  { id: "detail", text: "Keep local module directories self-contained with variables, outputs, versions, and a clear README. Use paths relative to the calling module, not assumptions about the developer machine. Test changes through representative root modules because a local edit can affect every caller in the repository." },
  { id: "pitfall", text: "Using broad relative paths such as ../../shared makes repository moves risky and can confuse readers. Local modules also cannot be versioned independently from the repository commit. When consumers need independent release cadence, consider a registry or Git source instead." },
  { id: "rule", text: "Use local paths for nearby code with shared repository cadence." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
