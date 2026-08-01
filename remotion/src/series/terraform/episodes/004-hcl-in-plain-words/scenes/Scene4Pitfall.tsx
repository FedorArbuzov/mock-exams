import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Pitfall: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 22);
  const crossIn = progress01(frame, 24, 46);
  const rightIn = progress01(frame, 50, 74);
  const labelIn = progress01(frame, 78, 98);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div
            style={{
              position: "absolute",
              left: 240,
              top: 300,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{position: "relative", width: 200, height: 160}}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 20 + (i % 2) * 60,
                    top: 10 + Math.floor(i / 2) * 50,
                    width: 100,
                    height: 36,
                    borderRadius: 8,
                    border: `1.5px solid ${COLORS.red}88`,
                    background: "rgba(248, 113, 113, 0.08)",
                    transform: `rotate(${(i - 1.5) * 14}deg)`,
                    opacity: 0.7 + crossIn * 0.3,
                  }}
                />
              ))}
              <div style={{position: "absolute", right: -12, top: -12, opacity: crossIn}}>
                <XCircle size={44} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 750, opacity: crossIn}}>
              giant dynamic
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 300,
              width: 1,
              height: 200,
              background: COLORS.border,
              opacity: (leftIn + rightIn) / 2,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 720,
              top: 300,
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
                padding: "20px 28px",
                borderRadius: 12,
                border: `1.5px solid ${COLORS.green}88`,
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.4,
              }}
            >
              resource "x" "y" {"{"}
              <br />
              {"  "}name = "z"
              <br />
              {"}"}
            </div>
            <Checkmark progress={rightIn} size={40} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 750}}>
              start boring
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: "translate(-50%, -50%)",
              opacity: labelIn,
              color: COLORS.white,
              fontFamily: FONTS.sans,
              fontSize: 38,
              fontWeight: 720,
            }}
          >
            one resource, clear names
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
