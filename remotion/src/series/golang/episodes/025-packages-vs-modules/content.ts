import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/025-packages-vs-modules.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "module",
  "package",
  "import",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go organizes code into two nested units. Are package and module the same?",
  },
  {
    id: "definitions",
    text: "No. A module is the versioned unit declared in your project's module file — usually your whole repo or service. A package is one directory of source files that compile together under one package name.",
  },
  {
    id: "containment",
    text: "One module contains many packages. An import path loads a specific package from that module.",
  },
  {
    id: "mixingbugs",
    text: "Mixing the terms causes real bugs: you fetch a module but write code in packages inside it.",
  },
  {
    id: "memoryhook",
    text: "Memory hook: module equals dependency identity, package equals compile unit in a folder.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
