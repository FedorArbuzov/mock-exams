import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const TILES = ["Kubernetes", "Docker", "Terraform", "APIs"];

export const Scene3Teams: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const stampIn = progress01(frame, 4, 22);
  const stampRotate = interpolate(stampIn, [0, 1], [-8, -6]);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 560,
          transform: `translate(-50%, -50%) rotate(${stampRotate}deg) scale(${0.85 + stampIn * 0.15})`,
          opacity: stampIn,
          border: `3px solid ${COLORS.cyan}`,
          borderRadius: 12,
          padding: "14px 26px",
          color: COLORS.cyan,
          fontFamily: FONTS.sans,
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: 3,
          boxShadow: `0 0 24px ${COLORS.glowCyan}`,
        }}
      >
        BUILT WITH GO
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1020,
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 24,
        }}
      >
        {TILES.map((label, i) => {
          const delay = 20 + i * 12;
          const fromLeft = i % 2 === 0;
          const slide = spring({
            frame: Math.max(0, frame - delay),
            fps,
            config: {damping: 12, stiffness: 100, mass: 0.9},
          });
          const dotIn = progress01(frame, delay + 16, delay + 28);
          const dx = interpolate(slide, [0, 1], [fromLeft ? -260 : 260, 0], clamp);

          return (
            <div
              key={label}
              style={{
                width: 210,
                height: 160,
                borderRadius: 16,
                border: `1.5px solid ${COLORS.border}`,
                background: COLORS.card,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                transform: `translateX(${dx}px)`,
                opacity: interpolate(slide, [0, 0.3], [0, 1], clamp),
              }}
            >
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
                {label}
              </div>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: COLORS.green,
                  opacity: dotIn,
                  boxShadow: `0 0 8px ${COLORS.green}`,
                }}
              />
            </div>
          );
        })}
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
