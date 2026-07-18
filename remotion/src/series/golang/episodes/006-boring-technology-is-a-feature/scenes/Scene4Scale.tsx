import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Scale: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const growIn = progress01(frame, 6, durationInFrames * 0.55);
  const labelIn = progress01(frame, durationInFrames * 0.6, durationInFrames * 0.76);

  const blocks = useMemo(
    () => [
      {dx: -110, dy: -40, s: 0.9},
      {dx: 110, dy: -60, s: 0.75},
      {dx: -150, dy: 90, s: 0.7},
      {dx: 160, dy: 100, s: 0.85},
      {dx: 0, dy: -130, s: 0.6},
    ],
    [],
  );

  return (
    <AbsoluteFill>
      {blocks.map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + b.dx,
            top: 800 + b.dy,
            transform: `translate(-50%, -50%) scale(${growIn * b.s})`,
            width: 80,
            height: 80,
            borderRadius: 12,
            border: `1.5px solid ${COLORS.border}`,
            background: "rgba(15,23,42,0.6)",
            opacity: growIn * 0.8,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
          width: 110,
          height: 110,
          borderRadius: 22,
          background: COLORS.card,
          border: `2px solid ${COLORS.cyan}`,
          boxShadow: `0 0 26px ${COLORS.glowCyan}`,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1060,
          transform: "translateX(-50%)",
          opacity: labelIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 28,
          fontWeight: 720,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
        at scale
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
