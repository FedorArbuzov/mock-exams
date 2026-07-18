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
import {Scene2Mechanism} from "./scenes/Scene2Mechanism";
import {Scene3Temporary} from "./scenes/Scene3Temporary";
import {Scene4Remove} from "./scenes/Scene4Remove";
import {Scene5Trick} from "./scenes/Scene5Trick";

const SCENE_MAP: Record<string, React.FC<{text: string; durationInFrames: number}>> = {
  question: Scene1Question,
  mechanism: Scene2Mechanism,
  temporary: Scene3Temporary,
  remove: Scene4Remove,
  trick: Scene5Trick,
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
