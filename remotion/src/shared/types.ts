import type {FC} from "react";

export type SceneScript = {
  id: string;
  text: string;
};

export type SceneTiming = SceneScript & {
  from: number;
  durationInFrames: number;
  weight: number;
};

export type ReelProps = {
  audioSrc: string;
  audioDurationInSeconds: number;
};

/** One entry in a series' episode registry, consumed by Root.tsx. */
export type EpisodeConfig = {
  /** Composition id, e.g. "kubernetes-001-what-is-kubernetes". Must be unique across all series. */
  id: string;
  component: FC<ReelProps>;
  audioSrc: string;
  /** Fallback duration used only until calculateMetadata reads the real audio file. */
  audioDurationInSeconds: number;
};
