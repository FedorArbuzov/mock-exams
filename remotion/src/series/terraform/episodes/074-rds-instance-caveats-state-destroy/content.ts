import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "RDS caveats";

export const AUDIO_SRC = "audio/terraform/074-rds-instance-caveats-state-destroy.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 71.35;

export const HIGHLIGHT_WORDS = [
  "RDS",
  "data safety",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "DATABASE",
  chips: [
    "backup",
    "snapshot",
    "protect",
  ],
  lines: [
    "plan destroy -> data decision",
  ],
  bad: "No final snapshot",
  good: "Test restore",
  stamp: "DATA FIRST",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Databases make a destroy plan a data-retention decision." },
  { id: "explain", text: "An RDS instance has lifecycle-sensitive settings including engine version, storage, backups, maintenance windows, encryption, network placement, and deletion protection. Terraform state records its identity and configuration, but state cannot restore database data after destructive provider actions." },
  { id: "detail", text: "Enable backups and deletion protection for important instances, define final snapshot behavior, and test restoration procedures. Treat engine upgrades and parameter changes as operational changes with downtime or compatibility risk. Keep credentials in a secret manager and limit who can apply database plans." },
  { id: "pitfall", text: "A terraform destroy or replacement can delete a database if protections and final snapshots are not configured correctly. Changing certain attributes forces replacement. State removal only makes Terraform forget the instance; it does not make the data safe or unmanaged safely." },
  { id: "rule", text: "Plan RDS lifecycle around backup, restore, and deletion before apply." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
