import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AlertTriangle, CheckCircle2} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Pitfall: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const applyIn = progress01(frame, 0, 22);
  const strikeIn = progress01(frame, 24, 46);
  const planIn = progress01(frame, 50, 74);
  const labelIn = progress01(frame, 78, 98);

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
              left: 280,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - applyIn) * 12}px)`,
              opacity: applyIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{position: "relative"}}>
              <div
                style={{
                  padding: "20px 32px",
                  borderRadius: 14,
                  border: `1.5px solid ${COLORS.red}66`,
                  color: COLORS.red,
                  fontFamily: FONTS.mono,
                  fontSize: 46,
                  fontWeight: 800,
                  textDecoration: strikeIn > 0.15 ? "line-through" : "none",
                  opacity: 0.55 + (1 - strikeIn) * 0.45,
                }}
              >
                apply
              </div>
              <div style={{position: "absolute", right: -20, top: -20, opacity: strikeIn}}>
                <AlertTriangle size={44} color={COLORS.red} strokeWidth={1.6} />
              </div>
            </div>
            <div
              style={{
                color: COLORS.red,
                fontFamily: FONTS.sans,
                fontSize: 34,
                fontWeight: 700,
                opacity: strikeIn,
              }}
            >
              deploy button?
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              width: 1,
              height: 220,
              background: COLORS.border,
              opacity: (applyIn + planIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 680,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - planIn) * 12}px)`,
              opacity: planIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                padding: "20px 32px",
                borderRadius: 14,
                border: `2px solid ${COLORS.cyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 46,
                fontWeight: 800,
                boxShadow: `0 0 24px ${COLORS.glowCyan}`,
              }}
            >
              plan
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12}}>
              <CheckCircle2 size={40} color={COLORS.green} strokeWidth={1.6} />
              <div
                style={{
                  color: COLORS.green,
                  fontFamily: FONTS.sans,
                  fontSize: 38,
                  fontWeight: 750,
                }}
              >
                review first
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 540,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
            }}
          >
            plan = review · apply = commit
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
