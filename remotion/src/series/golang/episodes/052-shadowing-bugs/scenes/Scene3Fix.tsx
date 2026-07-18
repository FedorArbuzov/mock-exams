import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Fix: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const badIn = progress01(frame, 0, 22);
  const xIn = progress01(frame, 24, 42);
  const goodIn = progress01(frame, 46, 68);
  const checkIn = progress01(frame, 72, 92);

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
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - badIn) * 12}px)`,
              opacity: badIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{position: "relative"}}>
              <div
                style={{
                  padding: "14px 22px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.red}66`,
                  color: COLORS.red,
                  fontFamily: FONTS.mono,
                  fontSize: 42,
                  fontWeight: 700,
                  textDecoration: xIn > 0.15 ? "line-through" : "none",
                  opacity: 0.55 + (1 - xIn) * 0.45,
                }}
              >
                err := do()
              </div>
              <div style={{position: "absolute", right: -18, top: -18, opacity: xIn}}>
                <XCircle size={42} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, opacity: xIn}}>
              shadows
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 260,
              width: 1,
              height: 260,
              background: COLORS.border,
              opacity: (badIn + goodIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - goodIn) * 12}px)`,
              opacity: goodIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 42,
                fontWeight: 700,
              }}
            >
              err = do()
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 12, opacity: checkIn}}>
              <Checkmark progress={checkIn} size={40} />
              <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 750}}>
                updates outer
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
