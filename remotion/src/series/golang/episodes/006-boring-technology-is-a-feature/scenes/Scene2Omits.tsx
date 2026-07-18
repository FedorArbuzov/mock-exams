import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const OMITTED = ["inheritance trees", "operator overloading"];

export const Scene2Omits: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const strike1 = progress01(frame, 24, 36);
  const strike2 = progress01(frame, 46, 58);
  const checkIn = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.7);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 640,
          transform: `translateX(-50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 650,
          textDecoration: strike1 > 0.15 ? "line-through" : "none",
          textDecorationColor: COLORS.red,
          opacity: fadeSlideUp(frame, 0, 16).opacity * (1 - strike1 * 0.4),
        }}
      >
        {OMITTED[0]}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: `translateX(-50%) translateY(${(1 - fadeSlideUp(frame, 16, 16).opacity) * 20}px)`,
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 650,
          textDecoration: strike2 > 0.15 ? "line-through" : "none",
          textDecorationColor: COLORS.red,
          opacity: fadeSlideUp(frame, 16, 16).opacity * (1 - strike2 * 0.4),
        }}
      >
        {OMITTED[1]}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 960,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          opacity: checkIn,
        }}
      >
        <div
          style={{
            padding: "12px 22px",
            borderRadius: 999,
            border: `1.5px solid ${COLORS.cyan}`,
            color: COLORS.cyan,
            fontFamily: FONTS.mono,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          gofmt
        </div>
        <Checkmark progress={checkIn} size={44} />
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
