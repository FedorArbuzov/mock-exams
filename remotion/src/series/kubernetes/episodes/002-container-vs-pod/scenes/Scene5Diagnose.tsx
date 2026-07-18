import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Container} from "../../../icons/Container";
import {clamp, fadeSlideUp, floatY, pulse} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Diagnose: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const q1 = interpolate(frame, [12, 24], [0, 1], clamp);
  const q2 = interpolate(frame, [28, 40], [0, 1], clamp);
  const q3 = interpolate(frame, [44, 56], [0, 1], clamp);
  const chain = interpolate(frame, [60, 78], [0, 1], clamp);
  const restartFlash = pulse(frame, 0.35, 0.55, 1);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 130,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 14),
            background: "rgba(248,113,113,0.12)",
            border: `1.5px solid ${COLORS.red}88`,
            borderRadius: 18,
            padding: "14px 22px",
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 30,
            fontWeight: 650,
          }}
        >
          “the container restarted”
        </div>

        <div style={{display: "flex", flexDirection: "column", gap: 12, width: 860}}>
          <QCard opacity={q1} index={1} text="Which Pod?" />
          <QCard opacity={q2} index={2} text="Which container inside it?" />
          <QCard opacity={q3} index={3} text="Who owns that Pod?" />
        </div>

        <div
          style={{
            marginTop: 10,
            opacity: chain,
            transform: `translateY(${(1 - chain) * 20}px)`,
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontFamily: FONTS.sans,
          }}
        >
          <OwnerBox label="Deployment" />
          <span style={{color: COLORS.cyan, fontSize: 28}}>→</span>
          <OwnerBox label="ReplicaSet" />
          <span style={{color: COLORS.cyan, fontSize: 28}}>→</span>
          <div
            style={{
              borderRadius: 18,
              border: `2px solid ${COLORS.cyan}`,
              padding: 14,
              background: "rgba(8,14,28,0.95)",
              display: "flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div style={{color: COLORS.muted, fontSize: 16, fontWeight: 650, marginRight: 4}}>
              Pod
            </div>
            <Container label="app" size={72} active />
            <div style={{opacity: restartFlash, transform: `translateY(${floatY(frame)}px)`}}>
              <Container label="side" size={72} active={false} />
            </div>
          </div>
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const QCard: React.FC<{opacity: number; index: number; text: string}> = ({
  opacity,
  index,
  text,
}) => (
  <div
    style={{
      opacity,
      transform: `translateX(${(1 - opacity) * 24}px)`,
      borderRadius: 16,
      border: `1.5px solid ${COLORS.border}`,
      background: COLORS.card,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      color: COLORS.white,
      fontFamily: FONTS.sans,
      fontSize: 28,
      fontWeight: 650,
    }}
  >
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 99,
        background: COLORS.kubernetesBlue,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        fontWeight: 800,
      }}
    >
      {index}
    </div>
    {text}
  </div>
);

const OwnerBox: React.FC<{label: string}> = ({label}) => (
  <div
    style={{
      borderRadius: 14,
      border: `1px solid ${COLORS.border}`,
      background: COLORS.card,
      padding: "12px 16px",
      color: COLORS.white,
      fontSize: 20,
      fontWeight: 700,
    }}
  >
    {label}
  </div>
);
