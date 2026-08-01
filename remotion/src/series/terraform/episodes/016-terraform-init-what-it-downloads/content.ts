import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Terraform Init";

export const AUDIO_SRC = "audio/terraform/016-terraform-init-what-it-downloads.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 64.51;

export const HIGHLIGHT_WORDS = [
  "init",
  "providers",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "what init gets",
  chips: [
    "providers",
    "modules",
    "backend",
  ],
  lines: [
    "$ terraform init",
    ".terraform/",
    ".terraform.lock.hcl",
  ],
  bad: "skip init",
  good: "prepare folder",
  stamp: "INIT PREPARES WORK",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "What actually happens during init?" },
  { id: "explain", text: "Terraform init prepares a working directory before planning or applying. It downloads the provider plugins required by your configuration, initializes the backend for state, and fetches referenced modules. It records selected provider versions in the dependency lock file when appropriate." },
  { id: "detail", text: "Run terraform init after cloning a project, adding a provider or module, changing backend settings, or upgrading dependencies. The .terraform directory is local working data and normally stays out of Git. Review initialization output instead of ignoring warnings about backend or provider changes." },
  { id: "pitfall", text: "Init does not create cloud resources or validate every resource argument. Beginners sometimes assume it is a harmless reset, but backend reconfiguration options can change where Terraform reads and writes state." },
  { id: "rule", text: "Initialize whenever dependencies or backend settings change in a working directory." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
