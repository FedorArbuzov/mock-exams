import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {fadeSlideUp} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Controller: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const loop = durationInFrames > 0 ? (frame % Math.max(24, Math.floor(durationInFrames / 2))) : frame;
  const loopLen = Math.max(24, Math.floor(durationInFrames / 2));
  const scan = interpolate(loop, [0, loopLen * 0.55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const match = interpolate(loop, [loopLen * 0.55, loopLen * 0.85], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div style={{...fadeSlideUp(frame, 0, 14), textAlign: "center"}}>
        <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 56, fontWeight: 800}}>
          Desired vs Current
        </div>
        <div style={{marginTop: 12, color: COLORS.muted, fontSize: 30}}>
          Controller loop keeps them aligned
        </div>
      </div>

      <div
        style={{
          marginTop: 90,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
        }}
      >
        {[
          {title: "Desired State", value: "replicas: 3", color: COLORS.cyan},
          {title: "Current State", value: "replicas: 3", color: COLORS.green},
        ].map((card) => (
          <div
            key={card.title}
            style={{
              borderRadius: 22,
              border: `2px solid ${card.color}`,
              background: COLORS.card,
              boxShadow: `0 0 24px ${card.color}44`,
              padding: "34px 28px",
              textAlign: "center",
            }}
          >
            <div style={{color: COLORS.muted, fontSize: 26, fontWeight: 650}}>{card.title}</div>
            <div style={{marginTop: 18, color: card.color, fontSize: 40, fontWeight: 800}}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop: 50, textAlign: "center"}}>
        <div style={{color: COLORS.muted, fontSize: 28, marginBottom: 16}}>
          checking cluster… {Math.round(scan * 100)}%
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 99,
            background: "rgba(148,163,184,0.2)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${scan * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${COLORS.kubernetesBlue}, ${COLORS.cyan})`,
              boxShadow: `0 0 12px ${COLORS.cyan}`,
            }}
          />
        </div>
        <div
          style={{
            marginTop: 28,
            opacity: match,
            transform: `scale(${0.85 + match * 0.15})`,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
          }}
        >
          <Checkmark progress={match} />
          <div style={{color: COLORS.green, fontSize: 34, fontWeight: 750}}>States match</div>
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
