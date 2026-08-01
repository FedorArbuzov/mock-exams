import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Module versions";

export const AUDIO_SRC = "audio/terraform/089-version-pinning-modules.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.71;

export const HIGHLIGHT_WORDS = [
  "pinning",
  "reproducibility",
  "upgrades",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "PIN",
  chips: [
    "source",
    "version",
    "review",
  ],
  lines: [
    "version = \"1.4.0\"",
    "terraform init -upgrade",
  ],
  bad: "Latest by accident",
  good: "Known release",
  stamp: "SHORT RULE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Reusable code without a version is a moving target." },
  { id: "explain", text: "Pinning a module version makes deployments reproducible by selecting a known release instead of whatever is newest. For registry modules, declare a version constraint that matches your upgrade policy. Review module release notes and plans before widening that constraint or accepting a new version." },
  { id: "detail", text: "Exact versions maximize repeatability, while carefully chosen compatible ranges can reduce routine maintenance. Match the choice to the module's release discipline and your change controls. Commit dependency lock data where Terraform creates it, and record module upgrades as intentional changes with their own review." },
  { id: "pitfall", text: "Using no version constraint for a remote module lets a later initialization change the code under a stable configuration. Pinning too broadly can have the same result. Do not confuse module version constraints with provider version constraints; they solve related but separate risks." },
  { id: "rule", text: "Select known module releases and upgrade them deliberately." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
