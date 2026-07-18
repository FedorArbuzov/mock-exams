import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BAD_LINES = ["*int", "*string", "*bool", "*User"] as const;

export const Scene4Overuse: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const crossIn = progress01(frame, 28, 52);
  const rightIn = progress01(frame, 56, 80);

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
              left: 240,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{position: "relative"}}>
              <div
                style={{
                  padding: "18px 24px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.red}66`,
                  background: "rgba(15, 23, 42, 0.55)",
                }}
              >
                {BAD_LINES.map((line) => (
                  <div
                    key={line}
                    style={{
                      color: COLORS.red,
                      fontFamily: FONTS.mono,
                      fontSize: 38,
                      fontWeight: 700,
                      lineHeight: 1.5,
                      textDecoration: crossIn > 0.15 ? "line-through" : "none",
                      opacity: 0.55 + (1 - crossIn) * 0.45,
                    }}
                  >
                    {line}
                  </div>
                ))}
              </div>
              <div style={{position: "absolute", right: -18, top: -18, opacity: crossIn}}>
                <XCircle size={42} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12, opacity: crossIn}}>
              <AlertTriangle size={44} color={COLORS.red} strokeWidth={1.6} />
              <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
                pointer everything
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 280,
              width: 1,
              height: 260,
              background: COLORS.border,
              opacity: (leftIn + rightIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 280,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "16px 28px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.sans,
                fontSize: 38,
                fontWeight: 750,
                textAlign: "center",
                lineHeight: 1.4,
              }}
            >
              start with
              <br />
              value
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
