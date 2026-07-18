import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {NotebookIcon, RocketIcon} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5RuleOfThumb: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const notebookIn = progress01(frame, 4, 20);
  const arrowGrow = progress01(frame, 20, 50);
  const rocketIn = progress01(frame, 46, 64);
  const rocketGlow = interpolate(rocketIn, [0, 1], [0, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{display: "flex", alignItems: "center", gap: 0, width: 900, justifyContent: "space-between"}}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            ...fadeSlideUp(frame, 0, 16),
            opacity: notebookIn,
          }}
        >
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 20,
              border: "2px solid #FBBF24",
              background: COLORS.card,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 22px rgba(251,191,36,0.3)",
            }}
          >
            <NotebookIcon size={64} color="#FBBF24" />
          </div>
          <div style={{color: "#FBBF24", fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
            prototype
          </div>
        </div>

        <div
          style={{
            position: "relative",
            width: 260,
            height: 4,
            background: "rgba(148,163,184,0.2)",
            borderRadius: 2,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: 4,
              borderRadius: 2,
              width: `${arrowGrow * 100}%`,
              background: `linear-gradient(90deg, #FBBF24, ${COLORS.cyan})`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: `${arrowGrow * 100}%`,
              top: -8,
              transform: "translate(-50%, 0)",
              width: 0,
              height: 0,
              opacity: arrowGrow,
              borderTop: "8px solid transparent",
              borderBottom: "8px solid transparent",
              borderLeft: `12px solid ${COLORS.cyan}`,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            opacity: rocketIn,
            transform: `scale(${0.8 + rocketIn * 0.2})`,
          }}
        >
          <div
            style={{
              width: 130,
              height: 130,
              borderRadius: 20,
              border: `2px solid ${COLORS.cyan}`,
              background: COLORS.card,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 0 ${22 + rocketGlow * 14}px ${COLORS.glowCyan}`,
            }}
          >
            <RocketIcon size={64} color={COLORS.cyan} />
          </div>
          <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
            ship
          </div>
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
