import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {ShieldCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const BEFORE = [
  {name: "http-router", used: true},
  {name: "old-logger", used: false},
  {name: "json-utils", used: true},
  {name: "unused-mock", used: false},
];

const AFTER = ["http-router", "json-utils"];

export const Scene2AddFlow: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const arrowIn = progress01(frame, 60, 76);
  const rightIn = progress01(frame, 74, 92);
  const sealIn = progress01(frame, 100, 116);

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
        <Panel width={900} height={780}>
          <div style={{position: "absolute", left: 40, top: 50, width: 360, opacity: leftIn}}>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, marginBottom: 14}}>
              BEFORE TIDY
            </div>
            <div
              style={{
                borderRadius: 16,
                border: `1.5px solid ${COLORS.border}`,
                background: "rgba(7,12,24,0.9)",
                padding: "8px 0",
              }}
            >
              {BEFORE.map((dep) => (
                <div
                  key={dep.name}
                  style={{
                    padding: "16px 24px",
                    fontFamily: FONTS.mono,
                    fontSize: 26,
                    color: dep.used ? COLORS.white : COLORS.muted,
                    textDecoration: dep.used ? "none" : "line-through",
                    textDecorationColor: COLORS.red,
                  }}
                >
                  {dep.name}
                </div>
              ))}
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 400, transform: "translate(-50%, -50%)", opacity: arrowIn}}>
            <Arrow direction="right" size={54} color={COLORS.cyan} />
          </div>

          <div style={{position: "absolute", left: 500, top: 50, width: 360, opacity: rightIn}}>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, marginBottom: 14}}>
              AFTER TIDY
            </div>
            <div
              style={{
                borderRadius: 16,
                border: `1.5px solid ${COLORS.green}66`,
                background: "rgba(7,12,24,0.9)",
                padding: "8px 0",
              }}
            >
              {AFTER.map((dep) => (
                <div
                  key={dep}
                  style={{
                    padding: "16px 24px",
                    fontFamily: FONTS.mono,
                    fontSize: 26,
                    color: COLORS.white,
                  }}
                >
                  {dep}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 640,
              transform: "translate(-50%, -50%)",
              opacity: sealIn,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ShieldCheck size={44} color={COLORS.green} strokeWidth={1.7} />
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              checksums updated
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
