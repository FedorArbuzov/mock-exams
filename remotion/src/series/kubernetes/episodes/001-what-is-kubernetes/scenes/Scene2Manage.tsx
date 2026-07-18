import React from "react";
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Container} from "../../../icons/Container";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Manage: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const health = progress01(frame, Math.floor(durationInFrames * 0.2), Math.floor(durationInFrames * 0.45));
  const traffic = progress01(frame, Math.floor(durationInFrames * 0.45), Math.floor(durationInFrames * 0.7));
  const scaleIn = spring({
    frame: Math.max(0, frame - Math.floor(durationInFrames * 0.7)),
    fps,
    config: {damping: 16, stiffness: 120},
  });

  const containers = [0, 1, 2, 3, 4].map((i) => {
    const born =
      i < 3
        ? 1
        : interpolate(scaleIn, [0, 1], [0, 1]);
    return {i, born};
  });

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div style={{...fadeSlideUp(frame, 0, 16), textAlign: "center"}}>
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 58, fontWeight: 800}}>
          Kubernetes manages containers
        </div>
        <div style={{marginTop: 12, color: COLORS.muted, fontSize: 30}}>
          run → health checks → scale
        </div>
      </div>

      <div
        style={{
          marginTop: 80,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div style={{display: "flex", gap: 16}}>
          {containers.map(({i, born}) => (
            <div
              key={i}
              style={{
                opacity: born,
                transform: `scale(${interpolate(born, [0, 1], [0.7, 1])})`,
              }}
            >
              <Container label={`app-${i + 1}`} active={born > 0.5} size={108} />
            </div>
          ))}
        </div>

        <Arrow direction="down" color={COLORS.cyan} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: health,
            transform: `translateY(${(1 - health) * 16}px)`,
          }}
        >
          <div style={{color: COLORS.muted, fontSize: 28, fontWeight: 650}}>health checks</div>
          <Checkmark progress={health} size={64} />
          <div style={{color: COLORS.green, fontSize: 28, fontWeight: 750}}>healthy</div>
        </div>

        <Arrow direction="down" color={COLORS.green} />

        <div
          style={{
            opacity: traffic,
            color: COLORS.cyan,
            fontSize: 32,
            fontWeight: 700,
            textShadow: `0 0 14px ${COLORS.glowCyan}`,
          }}
        >
          traffic increases → new containers appear
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
