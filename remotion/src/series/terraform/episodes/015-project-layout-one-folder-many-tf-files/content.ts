import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Project Layout";

export const AUDIO_SRC = "audio/terraform/015-project-layout-one-folder-many-tf-files.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.40;

export const HIGHLIGHT_WORDS = [
  "files",
  "dependencies",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "one folder",
  chips: [
    "main",
    "vars",
    "outputs",
  ],
  lines: [
    "providers.tf",
    "variables.tf",
    "outputs.tf",
  ],
  bad: "file order",
  good: "dependency graph",
  stamp: "FILES ARE FOR HUMANS",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Does Terraform care which file holds a resource?" },
  { id: "explain", text: "Terraform reads all files ending in .tf in one working directory as a single configuration. File names are for human organization, not execution order. Splitting providers, variables, outputs, and resources into clear files helps people navigate without changing Terraform's dependency graph." },
  { id: "detail", text: "A simple layout often uses versions.tf, providers.tf, main.tf, variables.tf, outputs.tf, and terraform.tfvars outside version control when sensitive. Group files by purpose or domain once the project grows. Let resource references express dependencies instead of trying to control file order." },
  { id: "pitfall", text: "Do not create dozens of tiny files before the project has complexity. Also avoid assuming main.tf runs first; Terraform builds a graph from references, not the alphabetical order of files." },
  { id: "rule", text: "Organize files for humans; Terraform organizes resources by dependencies." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
