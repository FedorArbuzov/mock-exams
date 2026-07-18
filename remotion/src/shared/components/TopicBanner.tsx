import React from "react";
import {useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../constants";
import {progress01} from "../utils/animations";

type Props = {
  title: string;
  durationInFrames: number;
};

/** Large topic headline at the top of scene 1. */
export const TopicBanner: React.FC<Props> = ({title, durationInFrames}) => {
  const frame = useCurrentFrame();
  const inAnim = progress01(frame, 0, 18);
  const fadeOut = progress01(frame, durationInFrames - 12, durationInFrames);
  const opacity = inAnim * (1 - fadeOut * 0.35);
  const fontSize = title.length > 22 ? 52 : 60;

  return (
    <div
      style={{
        position: "absolute",
        left: 48,
        right: 48,
        top: 200,
        transform: `translateY(${(1 - inAnim) * 16}px)`,
        opacity,
        textAlign: "center",
        fontFamily: FONTS.sans,
        fontSize,
        lineHeight: 1.1,
        fontWeight: 850,
        letterSpacing: "-0.02em",
        color: COLORS.white,
        textShadow: `0 0 40px ${COLORS.glowCyan}, 0 4px 24px rgba(0,0,0,0.5)`,
      }}
    >
      <span style={{color: COLORS.cyan}}>{title}</span>
    </div>
  );
};
