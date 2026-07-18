import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Pod} from "../../../icons/Pod";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Placement: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const drop = interpolate(frame, [10, 40], [-120, 0], clamp);
  const highlight = interpolate(frame, [35, 50], [0, 1], clamp);
  const policy = interpolate(frame, [55, 85], [0, 1], clamp);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 150,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 26,
        }}
      >
        <div
          style={{
            ...fadeSlideUp(frame, 0, 14),
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 34,
            fontWeight: 720,
            textAlign: "center",
          }}
        >
          Pods land on a <span style={{color: COLORS.cyan}}>specific node</span>
        </div>

        <div style={{position: "relative", width: 900, height: 420}}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 0,
              transform: `translateX(-50%) translateY(${drop}px)`,
              zIndex: 3,
            }}
          >
            <Pod label="app" status="new" width={140} height={100} />
          </div>

          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: 40,
              right: 40,
              display: "flex",
              justifyContent: "space-between",
              gap: 18,
            }}
          >
            {[0, 1, 2].map((i) => {
              const selected = i === 1;
              const active = selected ? highlight : 0.35;
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: 150,
                    borderRadius: 18,
                    border: `2px solid ${selected ? COLORS.cyan : COLORS.border}`,
                    background: COLORS.card,
                    opacity: 0.45 + active * 0.55,
                    boxShadow: selected ? `0 0 24px ${COLORS.glowCyan}` : "none",
                    transform: `translateY(${floatY(frame + i * 10) * 0.3}px)`,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 16,
                    color: selected ? COLORS.cyan : COLORS.muted,
                    fontFamily: FONTS.sans,
                    fontWeight: 700,
                    fontSize: 22,
                  }}
                >
                  node-{i + 1}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              top: 130,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
              gap: 10,
              opacity: policy,
              flexWrap: "wrap",
            }}
          >
            {["Capacity", "Placement", "Networking", "Recovery"].map((label) => (
              <div
                key={label}
                style={{
                  borderRadius: 999,
                  border: `1px solid ${COLORS.kubernetesBlue}88`,
                  background: "rgba(8,14,28,0.92)",
                  color: COLORS.white,
                  fontFamily: FONTS.sans,
                  fontSize: 18,
                  fontWeight: 650,
                  padding: "8px 14px",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
