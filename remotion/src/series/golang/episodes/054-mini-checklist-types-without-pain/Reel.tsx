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
import {Scene2Zero} from "./scenes/Scene2Zero";
import {Scene3Convert} from "./scenes/Scene3Convert";
import {Scene4Shadow} from "./scenes/Scene4Shadow";
import {Scene5Checklist} from "./scenes/Scene5Checklist";

const SCENE_MAP: Record<string, React.FC<{text: string; durationInFrames: number}>> = {
  question: Scene1Question,
  zero: Scene2Zero,
  convert: Scene3Convert,
  shadow: Scene4Shadow,
  checklist: Scene5Checklist,
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
