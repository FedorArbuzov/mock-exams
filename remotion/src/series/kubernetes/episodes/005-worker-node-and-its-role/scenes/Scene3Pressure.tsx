import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PRESSURES = ["MemoryPressure", "DiskPressure", "PIDPressure"] as const;
const SYMPTOMS = ["Pending", "Evicted", "ContainerCreating"] as const;

export const Scene3Pressure: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const pressureIn = progress01(frame, 0, 28);
  const symptomIn = progress01(frame, 32, 58);

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
              top: 170,
              transform: "translate(-50%, -50%)",
              opacity: pressureIn,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              width: 820,
              justifyContent: "center",
            }}
          >
            {PRESSURES.map((p, i) => {
              const pIn = progress01(frame, 4 + i * 10, 22 + i * 10);
              return (
                <div
                  key={p}
                  style={{
                    opacity: pIn,
                    padding: "14px 20px",
                    borderRadius: 12,
                    border: `2px solid ${COLORS.red}`,
                    color: COLORS.red,
                    fontFamily: FONTS.mono,
                    fontSize: 34,
                    fontWeight: 700,
                    background: "rgba(248, 113, 113, 0.08)",
                  }}
                >
                  {p}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 340,
              transform: "translate(-50%, -50%)",
              opacity: pressureIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <AlertTriangle size={48} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750}}>
              node saturated
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 500,
              transform: "translate(-50%, -50%)",
              opacity: symptomIn,
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              width: 820,
              justifyContent: "center",
            }}
          >
            {SYMPTOMS.map((s, i) => {
              const sIn = progress01(frame, 36 + i * 10, 54 + i * 10);
              return (
                <div
                  key={s}
                  style={{
                    opacity: sIn,
                    padding: "14px 22px",
                    borderRadius: 12,
                    border: `1.5px solid ${COLORS.border}`,
                    color: COLORS.cyan,
                    fontFamily: FONTS.mono,
                    fontSize: 38,
                    fontWeight: 750,
                    background: "rgba(15, 23, 42, 0.55)",
                  }}
                >
                  {s}
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 640,
              transform: "translate(-50%, -50%)",
              opacity: symptomIn,
              color: COLORS.muted,
              fontFamily: FONTS.sans,
              fontSize: 34,
              fontWeight: 650,
            }}
          >
            looks like app bug · is capacity
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
