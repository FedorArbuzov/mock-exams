import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {BriefcaseIcon} from "../../../../../shared/components/icons";
import {fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 18).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 18).opacity,
        }}
      >
        <BriefcaseIcon size={190} color={COLORS.cyan} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1000,
          transform: "translateX(-50%)",
          color: COLORS.cyan,
          fontSize: 46,
          fontWeight: 800,
          opacity: 0.75 + Math.sin(frame * 0.12) * 0.2,
          textShadow: `0 0 16px ${COLORS.glowCyan}`,
        }}
      >
        ?
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
