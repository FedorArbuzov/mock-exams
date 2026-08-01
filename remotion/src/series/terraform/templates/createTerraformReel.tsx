import React, {useMemo} from "react";
import {AbsoluteFill, Audio, Sequence, staticFile} from "remotion";
import {Background} from "../../../shared/components/Background";
import {BrandFooter} from "../../../shared/components/BrandFooter";
import {CTAScene} from "../../../shared/components/CTAScene";
import {FPS} from "../../../shared/constants";
import {HighlightWordsProvider} from "../../../shared/HighlightWords";
import {buildSceneTimings} from "../../../shared/timings";
import type {ReelProps, SceneScript} from "../../../shared/types";
import {TemplateChips} from "./TemplateChips";
import {TemplateCode} from "./TemplateCode";
import {TemplateContrast} from "./TemplateContrast";
import {TemplateHook} from "./TemplateHook";
import {TemplateRule} from "./TemplateRule";

export type TerraformVisual = {
  mark: string;
  chips: string[];
  lines: string[];
  bad: string;
  good: string;
  stamp: string;
};

export type TerraformEpisodeContent = {
  TOPIC_TITLE: string;
  AUDIO_SRC: string;
  HIGHLIGHT_WORDS: readonly string[];
  SCENE_SCRIPTS: SceneScript[];
  VISUAL: TerraformVisual;
};

/** Shared Reel for generated Terraform episodes (template scenes). */
export const createTerraformReel = (content: TerraformEpisodeContent) => {
  const Reel: React.FC<ReelProps> = ({
    audioSrc = content.AUDIO_SRC,
    audioDurationInSeconds,
  }) => {
    const timings = useMemo(() => {
      const totalFrames = Math.max(1, Math.ceil(audioDurationInSeconds * FPS));
      return buildSceneTimings(totalFrames, content.SCENE_SCRIPTS);
    }, [audioDurationInSeconds]);

    const v = content.VISUAL;

    const SCENE_MAP: Record<string, React.FC<{text: string; durationInFrames: number}>> = {
      question: ({text, durationInFrames}) => (
        <TemplateHook
          text={text}
          durationInFrames={durationInFrames}
          topicTitle={content.TOPIC_TITLE}
          mark={v.mark}
        />
      ),
      explain: ({text, durationInFrames}) => (
        <TemplateChips text={text} durationInFrames={durationInFrames} chips={v.chips} />
      ),
      detail: ({text, durationInFrames}) => (
        <TemplateCode text={text} durationInFrames={durationInFrames} lines={v.lines} />
      ),
      pitfall: ({text, durationInFrames}) => (
        <TemplateContrast
          text={text}
          durationInFrames={durationInFrames}
          bad={v.bad}
          good={v.good}
        />
      ),
      rule: ({text, durationInFrames}) => (
        <TemplateRule text={text} durationInFrames={durationInFrames} stamp={v.stamp} />
      ),
      cta: (props) => <CTAScene {...props} headline="Master Terraform faster" />,
    };

    return (
      <HighlightWordsProvider words={content.HIGHLIGHT_WORDS}>
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

  return Reel;
};
