import React, {useMemo} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PILE_CENTER_Y = 900;

const SMALL_TILES = Array.from({length: 10}, (_, i) => {
  const angle = (i / 10) * Math.PI * 2;
  const radius = 300 + (i % 3) * 46;
  return {
    x: 540 + Math.cos(angle) * radius,
    y: PILE_CENTER_Y + Math.sin(angle) * radius * 0.72,
  };
});

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const shrink = progress01(frame, durationInFrames * 0.28, durationInFrames * 0.6);
  const bigScale = interpolate(shrink, [0, 1], [1, 0.55], clamp);
  const bigY = interpolate(shrink, [0, 1], [PILE_CENTER_Y, 720], clamp);
  const tilesIn = progress01(frame, durationInFrames * 0.32, durationInFrames * 0.62);
  const tagIn = progress01(frame, durationInFrames * 0.68, durationInFrames * 0.82);

  return (
    <AbsoluteFill>
      {SMALL_TILES.map((tile, i) => {
        const stagger = progress01(frame, durationInFrames * 0.32 + i * 2, durationInFrames * 0.32 + i * 2 + 16);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: tile.x - 45,
              top: tile.y - 30,
              width: 90,
              height: 60,
              borderRadius: 12,
              border: `1.5px solid ${COLORS.border}`,
              background: COLORS.card,
              opacity: stagger * tilesIn,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: bigY,
          transform: `translate(-50%, -50%) scale(${bigScale}) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 28}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
          width: 280,
          height: 170,
          borderRadius: 20,
          border: `2px solid ${COLORS.cyan}`,
          background: COLORS.card,
          boxShadow: `0 0 30px ${COLORS.glowCyan}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 40, fontWeight: 780}}>
          Google
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1280,
          transform: "translateX(-50%)",
          opacity: tagIn,
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 30,
          fontWeight: 720,
          textShadow: `0 0 14px ${COLORS.glowCyan}`,
        }}
      >
        + many more
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
