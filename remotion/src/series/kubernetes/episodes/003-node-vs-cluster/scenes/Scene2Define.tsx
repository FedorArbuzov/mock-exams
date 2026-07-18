import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {clamp, fadeSlideUp, floatY} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const b1 = interpolate(frame, [16, 28], [0, 1], clamp);
  const b2 = interpolate(frame, [28, 40], [0, 1], clamp);
  const b3 = interpolate(frame, [40, 52], [0, 1], clamp);
  const b4 = interpolate(frame, [52, 64], [0, 1], clamp);
  const cluster = interpolate(frame, [70, 90], [0, 1], clamp);

  return (
    <AbsoluteFill style={{padding: `${SPACING.screenPadY}px ${SPACING.screenPadX}px`}}>
      <div
        style={{
          marginTop: 140,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 24,
            width: "100%",
            justifyContent: "center",
            ...fadeSlideUp(frame, 0, 16),
          }}
        >
          <div
            style={{
              width: 400,
              borderRadius: 24,
              border: `2px solid ${COLORS.cyan}`,
              background: COLORS.card,
              padding: 22,
              fontFamily: FONTS.sans,
            }}
          >
            <div style={{color: COLORS.cyan, fontSize: 30, fontWeight: 750}}>Node</div>
            <ServerIcon />
            <div style={{display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14}}>
              <Badge opacity={b1} text="CPU" />
              <Badge opacity={b2} text="Memory" />
              <Badge opacity={b3} text="Disk" />
              <Badge opacity={b4} text="kubelet" accent />
            </div>
          </div>

          <div
            style={{
              width: 460,
              borderRadius: 24,
              border: `2px solid ${COLORS.kubernetesBlue}`,
              background: COLORS.card,
              padding: 22,
              opacity: 0.55 + cluster * 0.45,
              transform: `translateY(${(1 - cluster) * 16}px)`,
              fontFamily: FONTS.sans,
            }}
          >
            <div style={{color: COLORS.kubernetesBlue, fontSize: 30, fontWeight: 750}}>
              Cluster
            </div>
            <div
              style={{
                marginTop: 12,
                borderRadius: 14,
                border: `1px solid ${COLORS.cyan}66`,
                padding: "10px 14px",
                color: COLORS.white,
                fontSize: 20,
                fontWeight: 650,
                textAlign: "center",
                boxShadow: `0 0 16px ${COLORS.glowCyan}`,
              }}
            >
              Control Plane
            </div>
            <div style={{display: "flex", justifyContent: "center", gap: 12, marginTop: 18}}>
              {[0, 1, 2].map((i) => (
                <MiniNode key={i} y={floatY(frame + i * 11)} active={cluster > 0.4} />
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                textAlign: "center",
                color: COLORS.muted,
                fontSize: 20,
                opacity: cluster,
              }}
            >
              many nodes → one system
            </div>
          </div>
        </div>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const Badge: React.FC<{opacity: number; text: string; accent?: boolean}> = ({
  opacity,
  text,
  accent,
}) => (
  <div
    style={{
      opacity,
      color: accent ? COLORS.cyan : COLORS.white,
      border: `1px solid ${accent ? COLORS.cyan : COLORS.border}`,
      borderRadius: 10,
      padding: "6px 10px",
      fontSize: 18,
      fontWeight: 650,
      background: "rgba(8,14,28,0.9)",
    }}
  >
    {text}
  </div>
);

const ServerIcon = () => (
  <div
    style={{
      marginTop: 16,
      height: 110,
      borderRadius: 16,
      border: `1.5px solid ${COLORS.border}`,
      background: "rgba(8,14,28,0.95)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      gap: 10,
      padding: "14px 18px",
    }}
  >
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        style={{
          height: 12,
          borderRadius: 6,
          background: `linear-gradient(90deg, ${COLORS.cyan}55, transparent)`,
          border: `1px solid ${COLORS.cyan}44`,
        }}
      />
    ))}
  </div>
);

const MiniNode: React.FC<{y: number; active: boolean}> = ({y, active}) => (
  <div
    style={{
      width: 84,
      height: 70,
      borderRadius: 12,
      border: `2px solid ${active ? COLORS.green : COLORS.muted}`,
      background: "rgba(8,14,28,0.95)",
      boxShadow: active ? `0 0 14px ${COLORS.glowGreen}` : "none",
      transform: `translateY(${y}px)`,
    }}
  />
);
