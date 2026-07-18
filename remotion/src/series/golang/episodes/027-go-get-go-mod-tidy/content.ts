import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/027-go-get-go-mod-tidy.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go mod tidy",
  "go get",
  "checksums",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go manages dependencies through a couple of specific commands. How do dependencies not rot?",
  },
  {
    id: "addflow",
    text: "You add dependencies by importing them and running go mod tidy. Tidy adds what you use, removes what you do not, and updates your checksums.",
  },
  {
    id: "bump",
    text: "go get bumps a specific dependency to a chosen version. Blind updates across everything is how teams break builds on Friday afternoons.",
  },
  {
    id: "safety",
    text: "Read changelogs on upgrades. Run your tests after every dependency change.",
  },
  {
    id: "habit",
    text: "Healthy habit: tidy before commit, never hand-edit your checksums file unless you know why.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
