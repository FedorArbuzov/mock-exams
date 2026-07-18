import type {SceneScript, SceneTiming} from "./types";

/**
 * Generic timing engine shared by every episode.
 * Do not hardcode frame ranges — scene durations are proportional to text length.
 */

export const getTotalFramesFromAudio = (durationSeconds: number, fps: number): number =>
  Math.max(1, Math.ceil(durationSeconds * fps));

export const fullNarration = (scenes: readonly SceneScript[]): string =>
  scenes.map((s) => s.text).join(" ");

export const buildSceneTimings = (
  totalFrames: number,
  scenes: readonly SceneScript[],
): SceneTiming[] => {
  const weights = scenes.map((scene) => Math.max(1, scene.text.trim().length));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let cursor = 0;
  return scenes.map((scene, index) => {
    const isLast = index === scenes.length - 1;
    const durationInFrames = isLast
      ? Math.max(1, totalFrames - cursor)
      : Math.max(1, Math.round((weights[index] / totalWeight) * totalFrames));

    const timing: SceneTiming = {
      ...scene,
      weight: weights[index],
      from: cursor,
      durationInFrames,
    };
    cursor += durationInFrames;
    return timing;
  });
};

/** Caption phrases = scene texts with computed absolute frame windows. */
export const buildCaptionCues = (timings: readonly SceneTiming[]) =>
  timings.map((scene) => ({
    id: scene.id,
    text: scene.text,
    from: scene.from,
    to: scene.from + scene.durationInFrames,
  }));
