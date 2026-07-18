import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Check: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cmdIn = progress01(frame, 0, 22);
  const compareIn = progress01(frame, 30, 52);

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
              top: 180,
              transform: `translate(-50%, -50%) translateY(${(1 - cmdIn) * 12}px)`,
              opacity: cmdIn,
              padding: "22px 28px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.cyan}`,
              background: "rgba(15, 23, 42, 0.55)",
              boxShadow: `0 0 20px ${COLORS.glowCyan}`,
            }}
          >
            <div
              style={{
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 780,
                lineHeight: 1.4,
              }}
            >
              kubectl get deployment
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 380,
              transform: `translate(-50%, -50%) translateY(${(1 - compareIn) * 12}px)`,
              opacity: compareIn,
              display: "flex",
              gap: 24,
              alignItems: "center",
            }}
          >
            <CompareCard label="desired" value="3/3" color={COLORS.cyan} />
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 44, fontWeight: 800}}>
              vs
            </div>
            <CompareCard label="READY" value="2/3" color={COLORS.red} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: "translate(-50%, -50%)",
              opacity: progress01(frame, 58, 78),
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
              textAlign: "center",
              width: 780,
              lineHeight: 1.4,
            }}
          >
            trace the controller before random restarts
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};

const CompareCard: React.FC<{label: string; value: string; color: string}> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      padding: "22px 28px",
      borderRadius: 14,
      border: `1.5px solid ${color}`,
      background: "rgba(15, 23, 42, 0.55)",
      minWidth: 220,
      textAlign: "center",
    }}
  >
    <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 720, marginBottom: 10}}>
      {label}
    </div>
    <div style={{color, fontFamily: FONTS.mono, fontSize: 46, fontWeight: 800}}>{value}</div>
  </div>
);
