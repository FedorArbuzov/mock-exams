import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GenericBracketIcon, LockIcon} from "../../../../../shared/components/icons";
import {fadeSlideUp, pulse} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const rattle = pulse(frame, 0.25, -2, 2);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 750,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 18).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 18).opacity,
        }}
      >
        <GenericBracketIcon size={190} color={COLORS.muted} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 930,
          transform: `translate(-50%, -50%) rotate(${rattle}deg) translateY(${(1 - fadeSlideUp(frame, 14, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 14, 16).opacity,
        }}
      >
        <LockIcon size={90} color={COLORS.red} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1090,
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
