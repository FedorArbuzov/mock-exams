import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {MagnifyingGlass, RocketIcon} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4LearnEarly: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const vetCheck = progress01(frame, 14, 32);
  const testCheck = progress01(frame, 30, 48);
  const liftoff = interpolate(frame, [durationInFrames * 0.6, durationInFrames * 0.9], [0, -60], clamp);
  const rocketIn = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.7);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 300,
          top: 680,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 4, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 4, 16).opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <MagnifyingGlass size={72} color={COLORS.cyan} />
        <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
          vet
        </div>
        <Checkmark progress={vetCheck} size={76} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 780,
          top: 680,
          transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, 10, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 10, 16).opacity,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Checkmark progress={1} size={72} />
        <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700}}>
          test
        </div>
        <Checkmark progress={testCheck} size={76} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1020 + liftoff,
          transform: "translate(-50%, -50%)",
          opacity: rocketIn,
        }}
      >
        <RocketIcon size={110} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1160,
          transform: "translateX(-50%)",
          opacity: rocketIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        before every push
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
