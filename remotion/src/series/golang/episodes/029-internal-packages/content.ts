import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/029-internal-packages.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "internal",
  "compiler rule",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go has a folder name with real compiler enforcement behind it. How do I hide code from outsiders?",
  },
  {
    id: "enforcement",
    text: "Put packages under an internal directory. Go enforces that code inside it can only be imported by packages inside the parent tree. External modules cannot import your internal packages even if the repo is public.",
  },
  {
    id: "strongerthanconvention",
    text: "That is stronger than lowercase unexported names — it is a compiler rule, not a convention.",
  },
  {
    id: "layout",
    text: "Layout example: a cmd folder holding your main program, an internal folder holding private database code, and top-level packages only for intentional public API.",
  },
  {
    id: "usecase",
    text: "Use internal for anything that is not a supported import surface.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
