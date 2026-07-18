import React from "react";
import {Composition, staticFile} from "remotion";
import {getAudioDurationInSeconds} from "@remotion/media-utils";
import {FPS, HEIGHT, WIDTH} from "./shared/constants";
import {getTotalFramesFromAudio} from "./shared/timings";
import {golangEpisodes} from "./series/golang/episodes";
import {kubernetesEpisodes} from "./series/kubernetes/episodes";

const episodes = [...kubernetesEpisodes, ...golangEpisodes];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {episodes.map((episode) => {
        const defaultTotalFrames = getTotalFramesFromAudio(
          episode.audioDurationInSeconds,
          FPS,
        );
        return (
          <Composition
            key={episode.id}
            id={episode.id}
            component={episode.component}
            durationInFrames={defaultTotalFrames}
            fps={FPS}
            width={WIDTH}
            height={HEIGHT}
            defaultProps={{
              audioSrc: episode.audioSrc,
              audioDurationInSeconds: episode.audioDurationInSeconds,
            }}
            calculateMetadata={async ({props}) => {
              const durationInSeconds = await getAudioDurationInSeconds(
                staticFile(props.audioSrc),
              );
              return {
                durationInFrames: getTotalFramesFromAudio(durationInSeconds, FPS),
                props: {
                  ...props,
                  audioDurationInSeconds: durationInSeconds,
                },
              };
            }}
          />
        );
      })}
    </>
  );
};
