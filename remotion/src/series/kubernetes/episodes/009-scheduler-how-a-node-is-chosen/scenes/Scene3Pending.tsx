import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {Pod} from "../../../icons/Pod";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BLOCKERS = [
  "insufficient resources",
  "taints / tolerations",
  "affinity mismatch",
  "PVC unbound",
] as const;

export const Scene3Pending: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const statusIn = progress01(frame, 0, 20);

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
        <Panel width={920} height={720} accent={COLORS.muted}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 150,
              transform: `translate(-50%, -50%) translateY(${(1 - statusIn) * 12}px)`,
              opacity: statusIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <Pod label="app" status="pending" width={150} height={115} />
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: 2,
              }}
            >
              STATUS: Pending
            </div>
          </div>

          {BLOCKERS.map((blocker, i) => {
            const stepIn = progress01(frame, 24 + i * 20, 44 + i * 20);
            return (
              <div
                key={blocker}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: 340 + i * 88,
                  transform: `translate(-50%, -50%) translateY(${(1 - stepIn) * 10}px)`,
                  opacity: stepIn,
                  color: COLORS.white,
                  fontFamily: FONTS.mono,
                  fontSize: 40,
                  fontWeight: 750,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.red}66`,
                  background: "rgba(15, 23, 42, 0.55)",
                  width: 760,
                  textAlign: "center",
                }}
              >
                {blocker}
              </div>
            );
          })}
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
