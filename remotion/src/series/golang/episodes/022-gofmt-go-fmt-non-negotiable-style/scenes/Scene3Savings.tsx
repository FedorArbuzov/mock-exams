import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const NOISY_LINES = [
  {c: COLORS.red, w: 70},
  {c: COLORS.green, w: 60},
  {c: COLORS.red, w: 80},
  {c: COLORS.green, w: 50},
  {c: COLORS.red, w: 65},
  {c: COLORS.green, w: 75},
];

const CLEAN_LINES = [
  {c: COLORS.muted, w: 70, dim: true},
  {c: COLORS.muted, w: 60, dim: true},
  {c: COLORS.red, w: 80, dim: false},
  {c: COLORS.green, w: 65, dim: false},
  {c: COLORS.muted, w: 55, dim: true},
  {c: COLORS.muted, w: 75, dim: true},
];

export const Scene3Savings: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 16, 36);
  const labelIn = progress01(frame, 40, 58);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={900} height={620}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 50,
              width: 380,
              opacity: leftIn,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                border: `1.5px solid ${COLORS.border}`,
                background: "rgba(7,12,24,0.9)",
                padding: "20px 22px",
              }}
            >
              {NOISY_LINES.map((l, i) => (
                <div
                  key={i}
                  style={{
                    width: `${l.w}%`,
                    height: 14,
                    borderRadius: 4,
                    background: l.c,
                    opacity: 0.55,
                    marginBottom: 10,
                  }}
                />
              ))}
            </div>
            <div style={{marginTop: 14, textAlign: "center", color: COLORS.red, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              brace wars
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 460,
              top: 50,
              width: 400,
              opacity: rightIn,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                border: `1.5px solid ${COLORS.green}66`,
                background: "rgba(7,12,24,0.9)",
                padding: "20px 22px",
              }}
            >
              {CLEAN_LINES.map((l, i) => (
                <div
                  key={i}
                  style={{
                    width: `${l.w}%`,
                    height: 14,
                    borderRadius: 4,
                    background: l.c,
                    opacity: l.dim ? 0.2 : 0.8,
                    marginBottom: 10,
                  }}
                />
              ))}
            </div>
            <div style={{marginTop: 14, textAlign: "center", color: COLORS.green, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              logic only
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 470,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 750,
              width: 700,
              textAlign: "center",
            }}
          >
            thousands of hours saved
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
