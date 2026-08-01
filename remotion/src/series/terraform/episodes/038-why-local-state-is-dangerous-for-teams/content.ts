import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Team State";

export const AUDIO_SRC = "audio/terraform/038-why-local-state-is-dangerous-for-teams.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 63.34;

export const HIGHLIGHT_WORDS = [
  "local state",
  "teams",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "local state risk",
  chips: [
    "laptop",
    "drift",
    "conflict",
  ],
  lines: [
    "alice: state",
    "bob: state",
    "CI: no state",
  ],
  bad: "state in Git",
  good: "shared backend",
  stamp: "ONE STATE FOR TEAM",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Why does local state break teamwork?" },
  { id: "explain", text: "Local state sits on one person's machine, so teammates and CI cannot reliably see the same infrastructure map. Two people can plan from different snapshots and overwrite each other's assumptions. Laptop loss, unshared changes, and inconsistent access controls make local state unsafe for team-managed environments." },
  { id: "detail", text: "Move shared environments to a remote backend with access control, encryption, version history, and locking. Give all automation the same backend configuration and use separate state per environment. Test backend access before migrating important state, and keep a verified backup." },
  { id: "pitfall", text: "Putting terraform.tfstate in Git is not a safe collaboration strategy. It causes merge conflicts, exposes sensitive contents, and cannot prevent two applies from operating against stale state at once." },
  { id: "rule", text: "Teams need one protected shared state, not copies on laptops." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
