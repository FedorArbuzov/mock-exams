import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {TargetIcon} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const approach = interpolate(frame, [10, durationInFrames * 0.6], [1, 0], clamp);
  const angle = frame * 0.06;
  const radius = 220 * approach;
  const dotX = 540 + Math.cos(angle) * radius;
  const dotY = 800 + Math.sin(angle) * radius;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 18).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 18).opacity,
        }}
      >
        <TargetIcon size={220} />
      </div>

      <div
        style={{
          position: "absolute",
          left: dotX - 9,
          top: dotY - 9,
          width: 18,
          height: 18,
          borderRadius: 99,
          background: COLORS.white,
          boxShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1080,
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
