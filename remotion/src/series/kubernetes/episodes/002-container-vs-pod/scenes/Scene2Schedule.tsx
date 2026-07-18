import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Container} from "../../../icons/Container";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Schedule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const reject = interpolate(frame, [8, 22], [0, 1], clamp);
  const accept = interpolate(frame, [28, 44], [0, 1], clamp);
  const label1 = interpolate(frame, [50, 62], [0, 1], clamp);
  const label2 = interpolate(frame, [62, 74], [0, 1], clamp);
  const label3 = interpolate(frame, [74, 86], [0, 1], clamp);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 160,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 36,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 14),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 40,
            fontWeight: 720,
            textAlign: "center",
          }}
        >
          Scheduler picks a <span style={{color: COLORS.cyan}}>Pod</span>
        </div>

        <div style={{display: "flex", alignItems: "center", gap: 28, ...fadeSlideUp(frame, 8, 16)}}>
          <div style={{position: "relative", opacity: 1 - reject * 0.35}}>
            <Container label="alone" size={120} active={reject < 0.5} />
            <div
              style={{
                position: "absolute",
                top: -10,
                right: -10,
                width: 36,
                height: 36,
                borderRadius: 99,
                background: COLORS.red,
                color: COLORS.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                opacity: reject,
                fontSize: 22,
              }}
            >
              ✕
            </div>
          </div>

          <div style={{color: COLORS.muted, fontSize: 34, fontFamily: FONTS.sans}}>→</div>

          <div
            style={{
              opacity: accept,
              transform: `scale(${0.86 + accept * 0.14}) translateY(${floatY(frame)}px)`,
              width: 420,
              minHeight: 280,
              borderRadius: 28,
              border: `2px solid ${COLORS.cyan}`,
              background: "rgba(8,14,28,0.92)",
              boxShadow: `0 0 28px ${COLORS.glowCyan}`,
              padding: 24,
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -14,
                left: 24,
                background: COLORS.kubernetesBlue,
                color: COLORS.white,
                fontSize: 18,
                fontWeight: 700,
                padding: "4px 12px",
                borderRadius: 999,
                fontFamily: FONTS.sans,
              }}
            >
              Pod
            </div>

            <div style={{display: "flex", justifyContent: "center", gap: 16, marginTop: 18}}>
              <Container label="app" size={100} active />
              <Container label="helper" size={100} active={frame > 55} />
            </div>

            <div
              style={{
                marginTop: 22,
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 650,
              }}
            >
              <Badge opacity={label1} text="1 IP" color={COLORS.cyan} />
              <Badge opacity={label2} text="Shared net" color={COLORS.kubernetesBlue} />
              <Badge opacity={label3} text="Volumes" color={COLORS.green} />
            </div>

            {/* network ring */}
            <div
              style={{
                position: "absolute",
                inset: 12,
                borderRadius: 22,
                border: `1.5px dashed ${COLORS.cyan}`,
                opacity: 0.25 + label2 * 0.45,
                pointerEvents: "none",
              }}
            />
          </div>
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Badge: React.FC<{opacity: number; text: string; color: string}> = ({
  opacity,
  text,
  color,
}) => (
  <div
    style={{
      opacity,
      color,
      background: "rgba(15,23,42,0.9)",
      border: `1px solid ${color}66`,
      borderRadius: 12,
      padding: "8px 12px",
      textShadow: `0 0 10px ${color}55`,
    }}
  >
    {text}
  </div>
);
