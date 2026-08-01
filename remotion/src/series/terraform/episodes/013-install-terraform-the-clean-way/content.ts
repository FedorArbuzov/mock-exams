import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Install Terraform";

export const AUDIO_SRC = "audio/terraform/013-install-terraform-the-clean-way.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 65.14;

export const HIGHLIGHT_WORDS = [
  "install",
  "version",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "clean install",
  chips: [
    "official",
    "verify",
    "PATH",
  ],
  lines: [
    "$ terraform version",
    "$ terraform -help",
  ],
  bad: "random binary",
  good: "verified CLI",
  stamp: "TRUST THE SOURCE",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why not just download a random binary?" },
  { id: "explain", text: "Install Terraform from HashiCorp's official distribution channels or a trusted package manager. This gives you a known executable, a predictable update path, and a version you can verify. Confirm that the terraform command is available from a new terminal session after installation." },
  { id: "detail", text: "On Windows, use a trusted package manager such as winget or Chocolatey when your organization permits it, or follow HashiCorp's official package instructions. Run terraform version after installation. Keep the binary outside project folders, then declare each project's supported version separately." },
  { id: "pitfall", text: "Do not commit a downloaded Terraform executable into a repository or rely on an unverified mirror. Different developers running random versions can get inconsistent provider behavior and confusing plan differences." },
  { id: "rule", text: "Install Terraform from trusted sources, then verify the exact CLI version." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
