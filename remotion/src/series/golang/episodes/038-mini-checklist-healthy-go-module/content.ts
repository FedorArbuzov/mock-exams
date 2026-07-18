import type {SceneScript} from "../../../../shared/types";

export const AUDIO_SRC = "audio/golang/038-mini-checklist-healthy-go-module.mp3";
/** Fallback if metadata cannot be read; calculateMetadata overrides this. */
export const AUDIO_DURATION_SECONDS = 45.0;

/** Episode-specific keywords; base CTA/branding words are added automatically. */
export const HIGHLIGHT_WORDS = [
  "clean",
  "module",
  "health check",
] as const;

export const SCENE_SCRIPTS: SceneScript[] = [
  {
    id: "question",
    text: "Go modules have a few objective health signals you can check anytime. When is my module clean?",
  },
  {
    id: "checks",
    text: "When your build passes, tidy changes nothing, tests pass, your module path is intentional, and every exported symbol has a doc comment.",
  },
  {
    id: "alsocheck",
    text: "Also check: no surprise replace directives, no mystery indirect dependencies you can't explain, and CI runs formatting, vet, and tests.",
  },
  {
    id: "boring",
    text: "A clean module is boring to clone — that's the goal. New contributors run two commands and they're unblocked.",
  },
  {
    id: "healthcheck",
    text: "Module health check: build, tidy, test, document exports.",
  },
  {
    id: "cta",
    text: "Master Go faster. Theory, hands-on labs, and interview questions — link in bio.",
  },
];
