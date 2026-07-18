import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/036-semantic-import-versioning.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "major version",
  "module path",
  "semantic",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go bakes version compatibility directly into the import path. Why do major versions change import paths?",
  },
  {
    id: "rule",
    text: "From major version two onward, Go requires that version number inside the module path itself. That makes a breaking change visible right at the import line.",
  },
  {
    id: "coexist",
    text: "Consumers on the old version keep working while the new version evolves — you cannot silently break everyone through the same import path.",
  },
  {
    id: "notdecoration",
    text: "If you see a version suffix in an import, that's a real major version marker — not decoration.",
  },
  {
    id: "publishrule",
    text: "Publishing rule: a breaking API change means a new major module path, not just a new tag.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
