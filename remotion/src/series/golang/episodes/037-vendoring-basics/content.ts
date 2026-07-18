import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/037-vendoring-basics.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "vendor",
  "hermetic",
  "checksums",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go modules download dependencies remotely by default. Should I vendor them?",
  },
  {
    id: "mechanism",
    text: "Sometimes. Vendoring copies your dependencies straight into the repository, so builds use those exact files — helpful for air-gapped CI, reproducible releases, or corporate policy.",
  },
  {
    id: "mostteams",
    text: "Most teams rely on checksums and the module cache instead. Vendoring adds repo size and update chores.",
  },
  {
    id: "howto",
    text: "If you vendor, commit that folder and build in vendor mode. If you don't, keep your checksums strict in CI.",
  },
  {
    id: "decision",
    text: "Decision: vendor when you must hermetically seal your dependencies — otherwise tidy plus checksums is enough.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
