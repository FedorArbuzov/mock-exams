import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Eye, XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const MAIN = {x: 450, y: 110};
const OK = {x: 260, y: 350};
const FAIL = {x: 640, y: 350};

export const Scene2Mechanism: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const mainIn = progress01(frame, 0, 18);
  const lineIn = progress01(frame, 16, 36);
  const okIn = progress01(frame, 34, 52);
  const failIn = progress01(frame, 34, 52);
  const noteIn = progress01(frame, 60, 80);

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
        <Panel width={900} height={720}>
          <svg width={900} height={720} style={{position: "absolute"}}>
            <line
              x1={MAIN.x}
              y1={MAIN.y + 44}
              x2={MAIN.x + (OK.x - MAIN.x) * lineIn}
              y2={MAIN.y + 44 + (OK.y - 40 - MAIN.y - 44) * lineIn}
              stroke={COLORS.green}
              strokeWidth={2.4}
              opacity={0.6}
            />
            <line
              x1={MAIN.x}
              y1={MAIN.y + 44}
              x2={MAIN.x + (FAIL.x - MAIN.x) * lineIn}
              y2={MAIN.y + 44 + (FAIL.y - 40 - MAIN.y - 44) * lineIn}
              stroke={COLORS.red}
              strokeWidth={2.4}
              opacity={0.6}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: MAIN.x,
              top: MAIN.y,
              transform: `translate(-50%, -50%) scale(${0.9 + mainIn * 0.1})`,
              opacity: mainIn,
              padding: "16px 34px",
              borderRadius: 14,
              border: `2px solid ${COLORS.white}`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 28,
              fontWeight: 700,
            }}
          >
            main
          </div>

          <div
            style={{
              position: "absolute",
              left: OK.x,
              top: OK.y,
              transform: `translate(-50%, -50%) translateY(${(1 - okIn) * 14}px)`,
              opacity: okIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 999,
                border: `3px solid ${COLORS.green}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.green,
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 800,
              }}
            >
              0
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              success
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: FAIL.x,
              top: FAIL.y,
              transform: `translate(-50%, -50%) translateY(${(1 - failIn) * 14}px)`,
              opacity: failIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 999,
                border: `3px solid ${COLORS.red}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLORS.red,
                fontFamily: FONTS.mono,
                fontSize: 44,
                fontWeight: 800,
              }}
            >
              1
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              failure
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 560,
              width: 900,
              display: "flex",
              justifyContent: "space-evenly",
              alignItems: "center",
              opacity: noteIn,
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: 14}}>
              <Eye size={44} color={COLORS.cyan} strokeWidth={1.8} />
              <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                CI reads this
              </div>
            </div>
            <div style={{display: "flex", alignItems: "center", gap: 14, opacity: 0.6}}>
              <XCircle size={40} color={COLORS.muted} strokeWidth={1.8} />
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                not printed output
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
