import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const RESOURCES = ["Deployment", "Pod", "Service", "Secret"] as const;

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const apiIn = progress01(frame, 0, 22);
  const arrowIn = progress01(frame, 24, 40);
  const etcdIn = progress01(frame, 42, 62);
  const watchIn = progress01(frame, 66, 86);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 180,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - apiIn) * 12}px)`,
              opacity: apiIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              padding: "24px 28px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.cyan}`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 780}}>
              API Server
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 34, fontWeight: 650}}>
              read / write
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 480,
              top: 280,
              opacity: arrowIn,
            }}
          >
            <Arrow direction="right" size={48} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - etcdIn) * 12}px)`,
              opacity: etcdIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
              padding: "24px 32px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.kubernetesBlue}`,
              background: "rgba(15, 23, 42, 0.55)",
              boxShadow: `0 0 24px ${COLORS.glowBlue}`,
            }}
          >
            <div
              style={{
                color: COLORS.kubernetesBlue,
                fontFamily: FONTS.mono,
                fontSize: 46,
                fontWeight: 800,
              }}
            >
              etcd
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 650}}>
              key-value store
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 520,
              transform: `translate(-50%, -50%) translateY(${(1 - watchIn) * 12}px)`,
              opacity: watchIn,
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 12,
              width: 820,
            }}
          >
            {RESOURCES.map((r, i) => {
              const badgeIn = progress01(frame, 70 + i * 8, 88 + i * 8);
              return (
                <div
                  key={r}
                  style={{
                    opacity: badgeIn,
                    color: COLORS.white,
                    fontFamily: FONTS.mono,
                    fontSize: 38,
                    fontWeight: 700,
                    padding: "10px 18px",
                    borderRadius: 10,
                    border: `1px solid ${COLORS.border}`,
                    background: "rgba(8,14,28,0.9)",
                  }}
                >
                  {r}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
