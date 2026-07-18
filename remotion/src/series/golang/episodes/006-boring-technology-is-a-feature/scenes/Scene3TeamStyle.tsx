import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {MagnifyingGlass} from "../../../../../shared/components/icons";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const GRID_TOP = 600;
const GRID_LEFT = 340;
const CELL = 140;
const GAP = 20;

export const Scene3TeamStyle: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const glassProgress = progress01(frame, durationInFrames * 0.55, durationInFrames * 0.85);
  const glassX = GRID_LEFT + glassProgress * (CELL * 3 + GAP * 2);
  const labelIn = progress01(frame, durationInFrames * 0.6, durationInFrames * 0.72);

  return (
    <AbsoluteFill>
      {Array.from({length: 9}).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const tileIn = progress01(frame, i * 4, i * 4 + 14);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: GRID_LEFT + col * (CELL + GAP),
              top: GRID_TOP + row * (CELL + GAP),
              width: CELL,
              height: CELL,
              borderRadius: 14,
              border: `1.5px solid ${COLORS.border}`,
              background: COLORS.card,
              opacity: tileIn,
              transform: `scale(${0.85 + tileIn * 0.15})`,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: glassX,
          top: GRID_TOP + CELL * 1.5 + GAP,
          transform: "translate(-50%, -50%)",
          opacity: glassProgress > 0 ? 1 : 0,
        }}
      >
        <MagnifyingGlass size={70} color={COLORS.cyan} />
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: GRID_TOP + CELL * 3 + GAP * 2 + 60,
          transform: "translateX(-50%)",
          opacity: labelIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 26,
          fontWeight: 700,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
logic
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
