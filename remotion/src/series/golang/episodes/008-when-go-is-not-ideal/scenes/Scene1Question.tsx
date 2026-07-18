import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {HammerIcon} from "../../../../../shared/components/icons";
import {fadeSlideUp, pulse} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const GRID = Array.from({length: 9}, (_, i) => ({
  x: 300 + (i % 3) * 240,
  y: 600 + Math.floor(i / 3) * 180,
}));

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const bob = pulse(frame, 0.08, -6, 6);
  const shapes = useMemo(() => GRID, []);

  return (
    <AbsoluteFill>
      {shapes.map((g, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: g.x,
            top: g.y,
            transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, i * 3, 14).opacity) * 20}px)`,
            opacity: fadeSlideUp(frame, i * 3, 14).opacity,
            width: 70,
            height: 70,
            borderRadius: 12,
            border: `1.5px solid ${COLORS.border}`,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 590,
          transform: `translate(-50%, -50%) rotate(${bob}deg) translateY(${(1 - fadeSlideUp(frame, 30, 18).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 30, 18).opacity,
        }}
      >
        <HammerIcon size={80} color={COLORS.cyan} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
