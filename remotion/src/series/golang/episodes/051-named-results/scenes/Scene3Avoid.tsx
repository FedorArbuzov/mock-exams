import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3Avoid: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const xIn = progress01(frame, 24, 44);
  const rightIn = progress01(frame, 48, 72);

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
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{position: "relative"}}>
              <div
                style={{
                  padding: "16px 22px",
                  borderRadius: 12,
                  border: `1.5px solid ${COLORS.red}66`,
                  color: COLORS.red,
                  fontFamily: FONTS.mono,
                  fontSize: 38,
                  fontWeight: 700,
                  lineHeight: 1.5,
                }}
              >
                long func (...)
                <br />
                many branches
              </div>
              <div style={{position: "absolute", right: -18, top: -18, opacity: xIn}}>
                <XCircle size={42} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, opacity: xIn}}>
              overuse
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
              opacity: (leftIn + rightIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 260,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div
              style={{
                padding: "14px 20px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.muted}88`,
                color: COLORS.muted,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 700,
              }}
            >
              track n, err
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700}}>
              harder to read
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
