import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CLIENTS = ["kubectl", "scheduler", "kubelet"] as const;

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const hubIn = progress01(frame, 24, 48);
  const clientIn = progress01(frame, 0, 40);

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
          {CLIENTS.map((client, i) => {
            const cIn = progress01(frame, 8 + i * 14, 26 + i * 14);
            return (
              <React.Fragment key={client}>
                <div
                  style={{
                    position: "absolute",
                    left: 180,
                    top: 180 + i * 160,
                    transform: `translate(-50%, -50%) translateY(${(1 - cIn) * 12}px)`,
                    opacity: cIn,
                    padding: "14px 22px",
                    borderRadius: 12,
                    border: `1.5px solid ${COLORS.border}`,
                    color: COLORS.white,
                    fontFamily: FONTS.mono,
                    fontSize: 38,
                    fontWeight: 750,
                    background: "rgba(15, 23, 42, 0.55)",
                  }}
                >
                  {client}
                </div>
                <div
                  style={{
                    position: "absolute",
                    left: 340,
                    top: 180 + i * 160,
                    opacity: cIn * clientIn,
                  }}
                >
                  <Arrow direction="right" size={40} color={COLORS.cyan} />
                </div>
              </React.Fragment>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: 620,
              top: 340,
              transform: `translate(-50%, -50%) scale(${0.9 + hubIn * 0.1})`,
              opacity: hubIn,
              width: 280,
              padding: "32px 24px",
              borderRadius: 20,
              border: `3px solid ${COLORS.kubernetesBlue}`,
              background: "rgba(50, 108, 229, 0.15)",
              textAlign: "center",
              boxShadow: `0 0 28px ${COLORS.glowBlue}`,
            }}
          >
            <div style={{color: COLORS.kubernetesBlue, fontFamily: FONTS.sans, fontSize: 42, fontWeight: 800}}>
              API Server
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 650, marginTop: 12}}>
              single front door
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 620,
              transform: "translate(-50%, -50%)",
              opacity: hubIn,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
            }}
          >
            every change passes through
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
