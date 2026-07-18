import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CHECKS = ["member health", "disk space", "request latency", "leader elections"] as const;

export const Scene4Check: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

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
        <Panel width={920} height={720}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 120,
              transform: "translate(-50%, -50%)",
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 40,
              fontWeight: 780,
              opacity: progress01(frame, 0, 18),
            }}
          >
            etcd health checks
          </div>

          {CHECKS.map((check, i) => {
            const stepIn = progress01(frame, 12 + i * 22, 32 + i * 22);
            return (
              <div
                key={check}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 220 + i * 110,
                  width: 780,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 12}px)`,
                  opacity: stepIn,
                  display: "flex",
                  alignItems: "center",
                  gap: 28,
                  padding: "20px 28px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.border}`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                <Checkmark progress={stepIn} size={48} />
                <div
                  style={{
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 42,
                    fontWeight: 750,
                  }}
                >
                  {check}
                </div>
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
