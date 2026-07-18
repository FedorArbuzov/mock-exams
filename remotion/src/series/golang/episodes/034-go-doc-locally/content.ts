import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/034-go-doc-locally.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "go doc",
  "offline",
  "toolchain",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go ships its documentation reader inside the toolchain itself. How do I read docs offline?",
  },
  {
    id: "usage",
    text: "Use go doc. Point it at a function and it prints the signature and documentation right there. Point it at a type and you get the type's docs. Add the all flag and it dumps every doc in that package.",
  },
  {
    id: "authoritative",
    text: "This beats random blog posts when you want the authoritative answer for your installed toolchain version.",
  },
  {
    id: "ownpackages",
    text: "Inside your own module, go doc summarizes your own packages too — useful before publishing.",
  },
  {
    id: "habit",
    text: "Terminal habit: check the docs with go doc before you import a mystery helper from Stack Overflow.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
