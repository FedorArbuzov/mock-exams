import type {SceneScript} from "../../../../shared/types";
import type {TerraformVisual} from "../../templates/createTerraformReel";

export const TOPIC_TITLE = "Safe Local AWS";

export const AUDIO_SRC = "audio/terraform/031-localstack-tflocal-for-safe-practice.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 68.21;

export const HIGHLIGHT_WORDS = [
  "LocalStack",
  "tflocal",
] as const;

export const VISUAL: TerraformVisual = {
  mark: "safe local AWS",
  chips: [
    "local",
    "fast",
    "sandbox",
  ],
  lines: [
    "$ tflocal init",
    "$ tflocal plan",
    "LocalStack",
  ],
  bad: "AWS certainty",
  good: "fast practice",
  stamp: "LOCAL IS NOT PROD",
};

export const SCENE_SCRIPTS: SceneScript[] = [
  { id: "question", text: "Can you practice AWS Terraform without AWS risk?" },
  { id: "explain", text: "LocalStack emulates selected AWS services locally, and tflocal helps run Terraform against that local endpoint setup. It can be useful for fast learning, demos, and some development tests without creating real cloud resources. It is an emulator, not a perfect replacement for AWS." },
  { id: "detail", text: "Start LocalStack according to its documentation, use a dedicated practice configuration, then run tflocal init and tflocal plan where supported. Keep real AWS credentials out of the exercise. Test important production behavior against a real sandbox account before relying on emulator results." },
  { id: "pitfall", text: "Do not assume a LocalStack success guarantees AWS success. Service coverage, IAM behavior, timing, defaults, and edge cases can differ, so treat local emulation as a fast feedback layer." },
  { id: "rule", text: "Use local emulation for speed, then verify critical behavior in a sandbox." },
  { id: "cta", text: "Master Terraform faster. Theory, hands-on labs, and interview questions - link in bio." },
];
