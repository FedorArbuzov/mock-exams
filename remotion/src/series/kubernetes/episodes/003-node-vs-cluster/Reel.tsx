import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import {Background} from "../../../../shared/components/Background";
import {BrandFooter} from "../../../../shared/components/BrandFooter";
import {FPS} from "../../../../shared/constants";
import {HighlightWordsProvider} from "../../../../shared/HighlightWords";
import {buildSceneTimings} from "../../../../shared/timings";
import type {ReelProps} from "../../../../shared/types";
import {AUDIO_SRC, HIGHLIGHT_WORDS, SCENE_SCRIPTS} from "./content";
import {Scene1Question} from "./scenes/Scene1Question";
import {Scene2Define} from "./scenes/Scene2Define";
import {Scene3Placement} from "./scenes/Scene3Placement";
import {Scene4Failure} from "./scenes/Scene4Failure";
import {Scene5Model} from "./scenes/Scene5Model";
import {Scene6CTA} from "./scenes/Scene6CTA";

const SCENE_MAP: Record<string, React.FC<{text: string; durationInFrames: number}>> = {
  question: Scene1Question,
  define: Scene2Define,
  placement: Scene3Placement,
  failure: Scene4Failure,
  model: Scene5Model,
  cta: Scene6CTA,
};

export const Reel: React.FC<ReelProps> = ({
  audioSrc = AUDIO_SRC,
  audioDurationInSeconds,
}) => {
  const timings = useMemo(() => {
    const totalFrames = Math.max(1, Math.ceil(audioDurationInSeconds * FPS));
    return buildSceneTimings(totalFrames, SCENE_SCRIPTS);
  }, [audioDurationInSeconds]);

  return (
    <HighlightWordsProvider words={HIGHLIGHT_WORDS}>
      <AbsoluteFill>
        <Background />
        <Audio src={staticFile(audioSrc)} />
        {timings.map((scene) => {
          const SceneComponent = SCENE_MAP[scene.id];
          return (
            <Sequence
              key={scene.id}
              from={scene.from}
              durationInFrames={scene.durationInFrames}
              name={scene.id}
            >
              <SceneComponent text={scene.text} durationInFrames={scene.durationInFrames} />
            </Sequence>
          );
        })}
        <BrandFooter />
      </AbsoluteFill>
    </HighlightWordsProvider>
  );
};
