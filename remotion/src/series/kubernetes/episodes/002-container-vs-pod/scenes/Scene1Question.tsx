import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Container} from "../../../icons/Container";
import {Pod} from "../../../icons/Pod";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene1Question: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.06], clamp);
  const slash = interpolate(frame, [18, 32], [0, 1], clamp);
  const qPulse = 0.65 + Math.sin(frame * 0.18) * 0.3;

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          transform: `scale(${zoom})`,
          marginTop: 200,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 48,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 16),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 52,
            fontWeight: 780,
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Container vs <span style={{color: COLORS.cyan}}>Pod</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            ...fadeSlideUp(frame, 10, 18),
          }}
        >
          <div style={{position: "relative", transform: `translateY(${floatY(frame)}px)`}}>
            <Container label="Container" active size={150} />
            <div
              style={{
                position: "absolute",
                inset: -8,
                borderRadius: 18,
                border: `3px solid ${COLORS.red}`,
                opacity: slash * 0.85,
                transform: `rotate(-18deg) scale(${0.9 + slash * 0.1})`,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "8%",
                right: "8%",
                top: "48%",
                height: 4,
                background: COLORS.red,
                opacity: slash,
                transform: "rotate(-18deg)",
                boxShadow: `0 0 12px ${COLORS.red}`,
              }}
            />
          </div>

          <div
            style={{
              color: COLORS.cyan,
              fontSize: 84,
              fontWeight: 800,
              opacity: qPulse,
              textShadow: `0 0 22px ${COLORS.glowCyan}`,
            }}
          >
            ?
          </div>

          <div style={{transform: `translateY(${floatY(frame + 20)}px) scale(${1 + slash * 0.04})`}}>
            <Pod label="Pod" status="new" width={170} height={130} />
          </div>
        </div>

        <div
          style={{
            ...fadeSlideUp(frame, 28, 16),
            color: COLORS.muted,
            fontFamily: FONTS.sans,
            fontSize: 28,
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Kubernetes does not schedule bare containers
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
