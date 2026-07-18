import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CODE = "fmt.Println(";

export const Scene3QuickDecision: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const typedChars = Math.round(interpolate(frame, [10, 40], [0, CODE.length], clamp));
  const tooltipIn = progress01(frame, 46, 66);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 700,
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            padding: "22px 30px",
            borderRadius: 16,
            border: `1.5px solid ${COLORS.border}`,
            background: "rgba(7, 12, 24, 0.95)",
            fontFamily: FONTS.mono,
            fontSize: 32,
            color: COLORS.white,
          }}
        >
          {CODE.slice(0, typedChars)}
          <span style={{opacity: typedChars < CODE.length ? 1 : 0, color: COLORS.cyan}}>|</span>
        </div>

        <div
          style={{
            marginTop: 14,
            padding: "16px 22px",
            borderRadius: 12,
            border: `1.5px solid ${COLORS.cyan}`,
            background: COLORS.card,
            boxShadow: `0 0 22px ${COLORS.glowCyan}`,
            fontFamily: FONTS.mono,
            fontSize: 20,
            color: COLORS.cyan,
            opacity: tooltipIn,
            transform: `translateY(${(1 - tooltipIn) * -10}px)`,
          }}
        >
          Println(a ...any) (n int, err error)
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1080,
          transform: "translateX(-50%)",
          color: COLORS.white,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 700,
          opacity: tooltipIn,
        }}
      >
        autocomplete confirmed
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
