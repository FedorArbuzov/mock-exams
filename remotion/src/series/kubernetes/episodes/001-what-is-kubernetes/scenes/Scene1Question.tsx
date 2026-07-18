import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Container} from "../../../icons/Container";
import {KubernetesLogo} from "../../../icons/KubernetesLogo";
import {fadeSlideUp, floatY, softScaleIn} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const titleStyle = softScaleIn(frame, fps, 2);
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          transform: `scale(${zoom}) translateY(${floatY(frame) * 0.4}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 40,
          marginTop: 180,
        }}
      >
        <div style={titleStyle}>
          <KubernetesLogo size={180} />
        </div>
        <div
          style={{
            ...fadeSlideUp(frame, 8, 20),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 68,
            fontWeight: 820,
            textAlign: "center",
            lineHeight: 1.12,
            textShadow: `0 0 28px ${COLORS.glowBlue}`,
            maxWidth: 900,
          }}
        >
          What does Kubernetes actually do?
        </div>
        <div style={{display: "flex", gap: 20, marginTop: 20, ...fadeSlideUp(frame, 18, 18)}}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{transform: `translateY(${floatY(frame + i * 12)}px)`}}>
              <Container label={`c${i + 1}`} active={frame > 20 + i * 6} />
            </div>
          ))}
        </div>
        <div style={{display: "flex", gap: 30, ...fadeSlideUp(frame, 28, 16)}}>
          {["?", "?", "?"].map((q, i) => (
            <div
              key={i}
              style={{
                color: COLORS.cyan,
                fontSize: 72,
                fontWeight: 800,
                opacity: 0.7 + Math.sin((frame + i * 10) * 0.15) * 0.25,
                textShadow: `0 0 18px ${COLORS.glowCyan}`,
              }}
            >
              {q}
            </div>
          ))}
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
