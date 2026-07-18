import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const COMPONENTS = [
  "api-server",
  "etcd",
  "scheduler",
  "controller-manager",
] as const;

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const brainIn = progress01(frame, 0, 22);
  const compIn = progress01(frame, 20, 50);
  const workerIn = progress01(frame, 52, 78);

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
              left: "50%",
              top: 160,
              transform: `translate(-50%, -50%) translateY(${(1 - brainIn) * 12}px)`,
              opacity: brainIn,
              padding: "18px 32px",
              borderRadius: 16,
              border: `2px solid ${COLORS.kubernetesBlue}`,
              background: "rgba(50, 108, 229, 0.15)",
              color: COLORS.kubernetesBlue,
              fontFamily: FONTS.sans,
              fontSize: 42,
              fontWeight: 800,
              boxShadow: `0 0 20px ${COLORS.glowBlue}`,
            }}
          >
            Control Plane
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              width: 820,
              justifyContent: "center",
              opacity: compIn,
            }}
          >
            {COMPONENTS.map((c, i) => {
              const itemIn = progress01(frame, 24 + i * 10, 40 + i * 10);
              return (
                <div
                  key={c}
                  style={{
                    opacity: itemIn,
                    transform: `translateY(${(1 - itemIn) * 10}px)`,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: `1.5px solid ${COLORS.cyan}`,
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 34,
                    fontWeight: 700,
                    background: "rgba(15, 23, 42, 0.55)",
                  }}
                >
                  {c}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 440,
              opacity: compIn * workerIn,
            }}
          >
            <Arrow direction="down" size={44} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: `translate(-50%, -50%) translateY(${(1 - workerIn) * 12}px)`,
              opacity: workerIn,
              display: "flex",
              gap: 16,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 140,
                  height: 90,
                  borderRadius: 14,
                  border: `2px solid ${COLORS.green}`,
                  background: "rgba(15, 23, 42, 0.55)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: COLORS.green,
                  fontFamily: FONTS.sans,
                  fontSize: 34,
                  fontWeight: 750,
                }}
              >
                worker
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 660,
              transform: "translate(-50%, -50%)",
              opacity: workerIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 650,
            }}
          >
            brain decides · workers run
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
