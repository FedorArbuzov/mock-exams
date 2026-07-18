import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Container} from "../../../icons/Container";
import {clamp, fadeSlideUp, floatY, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Multi: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const singlePhase = frame < durationInFrames * 0.35;
  const multiProgress = progress01(frame, durationInFrames * 0.28, durationInFrames * 0.55);
  const sidecarX = interpolate(multiProgress, [0, 1], [80, 0], clamp);
  const proxyOp = interpolate(frame, [durationInFrames * 0.5, durationInFrames * 0.62], [0, 1], clamp);
  const pulse = 0.4 + (Math.sin(frame * 0.25) + 1) * 0.3;

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 150,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 14),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 38,
            fontWeight: 720,
            textAlign: "center",
          }}
        >
          {singlePhase ? "Most Pods: one container" : "Helpers share the Pod"}
        </div>

        <div
          style={{
            width: 520,
            minHeight: 340,
            borderRadius: 28,
            border: `2px solid ${COLORS.cyan}`,
            background: "rgba(8,14,28,0.94)",
            boxShadow: `0 0 30px ${COLORS.glowCyan}`,
            padding: 28,
            position: "relative",
            ...fadeSlideUp(frame, 8, 16),
          }}
        >
          <div
            style={{
              position: "absolute",
              top: -14,
              left: 24,
              background: COLORS.green,
              color: "#062016",
              fontSize: 18,
              fontWeight: 750,
              padding: "4px 12px",
              borderRadius: 999,
              fontFamily: FONTS.sans,
              opacity: singlePhase ? 1 : 0.35,
            }}
          >
            Most common
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 18,
              marginTop: 36,
              minHeight: 160,
            }}
          >
            <div style={{opacity: proxyOp, transform: `translateY(${floatY(frame + 8)}px)`}}>
              <Container label="proxy" size={88} active={proxyOp > 0.5} />
            </div>
            <div style={{transform: `translateY(${floatY(frame)}px)`}}>
              <Container label="app" size={120} active />
            </div>
            <div
              style={{
                opacity: multiProgress,
                transform: `translateX(${sidecarX}px) translateY(${floatY(frame + 16)}px)`,
              }}
            >
              <Container label="sidecar" size={100} active={multiProgress > 0.6} />
            </div>
          </div>

          {/* localhost traffic */}
          <div
            style={{
              marginTop: 18,
              height: 4,
              width: "70%",
              marginLeft: "15%",
              borderRadius: 99,
              background: `linear-gradient(90deg, transparent, ${COLORS.cyan}, transparent)`,
              opacity: multiProgress * pulse,
              boxShadow: `0 0 12px ${COLORS.glowCyan}`,
            }}
          />
          <div
            style={{
              marginTop: 12,
              textAlign: "center",
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 22,
              fontWeight: 650,
              opacity: multiProgress,
            }}
          >
            localhost + shared disk
          </div>

          {singlePhase && (
            <div style={{position: "absolute", right: 18, bottom: 18}}>
              <Checkmark size={64} progress={interpolate(frame, [10, 28], [0, 1], clamp)} />
            </div>
          )}
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
