import React, {useMemo} from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {CTA} from "../../../../../shared/components/CTA";
import {clamp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
};

export const Scene7CTA: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const zoomOut = interpolate(frame, [0, durationInFrames], [1.08, 1], {
    ...clamp,
  });

  const particlesOpacity = interpolate(frame, [0, Math.floor(fps * 1.2)], [0, 0.85], clamp);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({length: 28}, (_, i) => ({
        id: i,
        x: ((i * 97) % 1000) / 10,
        y: ((i * 53) % 1000) / 10,
        size: 2 + (i % 4),
        speed: 0.12 + (i % 5) * 0.04,
        drift: (i % 2 === 0 ? 1 : -1) * (0.08 + (i % 3) * 0.03),
      })),
    [],
  );

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          transform: `scale(${zoomOut})`,
          transformOrigin: "50% 45%",
        }}
      >
        {/* Soft premium wash */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(50,108,229,0.18), transparent 58%)",
          }}
        />

        {/* Slow fade-in particles */}
        <div style={{position: "absolute", inset: 0, opacity: particlesOpacity}}>
          {particles.map((p) => {
            const y = (p.y + frame * p.speed) % 110;
            const x = (p.x + frame * p.drift + 100) % 100;
            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  width: p.size,
                  height: p.size,
                  borderRadius: 99,
                  background: iColor(p.id),
                  boxShadow: `0 0 ${6 + p.size}px ${iColor(p.id)}`,
                  opacity: 0.35 + (p.id % 5) * 0.08,
                }}
              />
            );
          })}
        </div>

        <AbsoluteFill
          style={{
            padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: 280,
          }}
        >
          <div
            style={{
              marginBottom: 36,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 26,
              fontWeight: 560,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              opacity: interpolate(frame, [0, 16], [0, 1], clamp),
            }}
          >
            Continue learning
          </div>
          <CTA />
          <div
            style={{
              marginTop: 28,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 28,
              fontWeight: 720,
              letterSpacing: 3.2,
              textTransform: "uppercase",
              opacity: interpolate(
                frame,
                [Math.floor(fps * 0.8), Math.floor(fps * 1.6)],
                [0, 0.95],
                clamp,
              ),
              textShadow: `0 0 20px ${COLORS.glowBlue}`,
            }}
          >
            EXALLENGE
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const iColor = (id: number) => {
  const palette = [COLORS.cyan, COLORS.kubernetesBlue, COLORS.green, COLORS.white];
  return palette[id % palette.length];
};
