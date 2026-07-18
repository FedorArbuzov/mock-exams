import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS} from "../constants";
import {clamp} from "../utils/animations";
import {Arrow} from "./Arrow";

/** Soft pulse every ~2 seconds at 30fps. */
const pulseEveryTwoSeconds = (frame: number, fps: number) => {
  const period = fps * 2;
  const phase = (frame % period) / period;
  // gentle breathe: peak mid-cycle
  const wave = Math.sin(phase * Math.PI * 2);
  return 1 + wave * 0.035;
};

type CTAProps = {
  headline?: string;
};

export const CTA: React.FC<CTAProps> = ({headline = "Master Kubernetes faster"}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const slide = spring({
    frame,
    fps,
    config: {damping: 16, stiffness: 95, mass: 0.85},
  });

  const translateY = interpolate(slide, [0, 1], [72, 0]);
  const opacity = interpolate(slide, [0, 1], [0, 1]);
  const glow = interpolate(slide, [0, 1], [0.15, 0.55], clamp);
  const linkPulse = pulseEveryTwoSeconds(frame, fps);
  const arrowBob = Math.sin((frame / fps) * Math.PI * 2) * 6;

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${translateY}px)`,
        width: 880,
        margin: "0 auto",
        borderRadius: 30,
        border: `1.5px solid rgba(34, 211, 238, 0.55)`,
        background:
          "linear-gradient(180deg, rgba(17, 24, 39, 0.96) 0%, rgba(8, 14, 28, 0.98) 100%)",
        boxShadow: `0 0 ${36 + glow * 24}px rgba(34, 211, 238, ${0.18 + glow * 0.22}), 0 24px 60px rgba(0,0,0,0.45)`,
        padding: "56px 44px 48px",
        textAlign: "center",
        fontFamily: FONTS.sans,
      }}
    >
      <div
        style={{
          color: COLORS.white,
          fontSize: 62,
          fontWeight: 780,
          lineHeight: 1.12,
          letterSpacing: -0.5,
        }}
      >
        {headline}
      </div>

      <div
        style={{
          marginTop: 22,
          color: COLORS.muted,
          fontSize: 30,
          fontWeight: 560,
          letterSpacing: 0.4,
        }}
      >
        Theory • Hands-on Labs • Interview Questions
      </div>

      <div
        style={{
          marginTop: 40,
          height: 1,
          width: "56%",
          marginLeft: "auto",
          marginRight: "auto",
          background: `linear-gradient(90deg, transparent, ${COLORS.cyan}88, transparent)`,
        }}
      />

      <div
        style={{
          marginTop: 28,
          color: COLORS.cyan,
          fontSize: 34,
          fontWeight: 700,
          letterSpacing: 0.6,
          transform: `scale(${linkPulse})`,
          textShadow: `0 0 18px ${COLORS.glowCyan}`,
        }}
      >
        Link in bio
      </div>

      <div
        style={{
          marginTop: 14,
          color: COLORS.muted,
          fontSize: 24,
          fontWeight: 560,
          letterSpacing: 1.2,
          opacity: 0.9,
        }}
      >
        exallenge.tech
      </div>

      <div
        style={{
          marginTop: 22,
          display: "flex",
          justifyContent: "center",
          transform: `translateY(${arrowBob}px)`,
        }}
      >
        <Arrow direction="up" size={52} color={COLORS.cyan} />
      </div>
    </div>
  );
};
