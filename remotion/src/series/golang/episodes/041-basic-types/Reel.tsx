import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import {Background} from "../../../../shared/components/Background";
import {BrandFooter} from "../../../../shared/components/BrandFooter";
import {CTAScene} from "../../../../shared/components/CTAScene";
import {FPS} from "../../../../shared/constants";
import {HighlightWordsProvider} from "../../../../shared/HighlightWords";
import {buildSceneTimings} from "../../../../shared/timings";
import type {ReelProps} from "../../../../shared/types";
import {AUDIO_SRC, HIGHLIGHT_WORDS, SCENE_SCRIPTS} from "./content";
import {Scene1Question} from "./scenes/Scene1Question";
import {Scene2Sizes} from "./scenes/Scene2Sizes";
import {Scene3BoolString} from "./scenes/Scene3BoolString";
import {Scene4Premature} from "./scenes/Scene4Premature";
import {Scene5Habit} from "./scenes/Scene5Habit";

const SCENE_MAP: Record<string, React.FC<{text: string; durationInFrames: number}>> = {
  question: Scene1Question,
  sizes: Scene2Sizes,
  boolstring: Scene3BoolString,
  premature: Scene4Premature,
  habit: Scene5Habit,
  cta: (props) => <CTAScene {...props} headline="Master Go faster" />,
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
