import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/033-doc-comments-on-exported-symbols.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "doc comment",
  "exported",
  "documentation",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go documentation is not written externally — it lives right above your code. Where does it actually come from?",
  },
  {
    id: "commentabove",
    text: "From comments directly above exported declarations. The comment should start with the name — a sentence like UserService handles becomes the documentation for that type.",
  },
  {
    id: "toolingrenders",
    text: "Go's doc tooling and the public package site render those comments directly. Undocumented exports look unfinished in review.",
  },
  {
    id: "prreview",
    text: "Do not document unexported helpers unless the reasoning is genuinely tricky. Do document every exported type, function, and package.",
  },
  {
    id: "dochabit",
    text: "Doc habit: write the comment before you export the name — it forces you to name things well.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
