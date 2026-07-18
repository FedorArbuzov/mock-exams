import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Failure: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cpIn = progress01(frame, 0, 24);
  const workerIn = progress01(frame, 28, 52);
  const labelIn = progress01(frame, 56, 80);

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
              top: 150,
              transform: `translate(-50%, -50%) translateY(${(1 - cpIn) * 12}px)`,
              opacity: cpIn,
              width: 780,
              padding: "20px 28px",
              borderRadius: 16,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248, 113, 113, 0.1)",
              display: "flex",
              alignItems: "center",
              gap: 20,
              boxShadow: `0 0 20px ${COLORS.red}44`,
            }}
          >
            <AlertTriangle size={52} color={COLORS.red} strokeWidth={1.6} />
            <div>
              <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 42, fontWeight: 800}}>
                Control Plane DOWN
              </div>
              <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 34, fontWeight: 650, marginTop: 6}}>
                kubectl fails · deploy blocked
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 380,
              transform: "translate(-50%, -50%)",
              opacity: workerIn,
              display: "flex",
              gap: 18,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 200,
                  height: 180,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.green}`,
                  background: "rgba(15, 23, 42, 0.55)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  opacity: 0.7 + workerIn * 0.3,
                }}
              >
                <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
                  worker-{i + 1}
                </div>
                <Pod label="pod" width={90} height={70} status="healthy" />
              </div>
            ))}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 580,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.cyan,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 750,
              textAlign: "center",
              width: 780,
            }}
          >
            old Pods may still run · drift unreconciled
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
