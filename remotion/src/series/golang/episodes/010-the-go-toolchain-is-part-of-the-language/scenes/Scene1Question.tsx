import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GearIcon} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const GHOSTS = [
  {dx: -190, dy: -40},
  {dx: 190, dy: -60},
  {dx: -160, dy: 160},
  {dx: 180, dy: 150},
];

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const spin = frame * 0.9;
  const ghostsIn = progress01(frame, durationInFrames * 0.4, durationInFrames * 0.75);
  const ghosts = useMemo(() => GHOSTS, []);

  return (
    <AbsoluteFill>
      {ghosts.map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 540 + g.dx,
            top: 780 + g.dy,
            transform: "translate(-50%, -50%)",
            width: 66,
            height: 66,
            borderRadius: 16,
            border: `2px solid ${COLORS.border}`,
            opacity: ghostsIn * 0.7,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translate(-50%, -50%) rotate(${spin}deg) translateY(${(1 - fadeSlideUp(frame, 0, 18).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 18).opacity,
        }}
      >
        <GearIcon size={190} color={COLORS.cyan} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        compiler
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1010,
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
