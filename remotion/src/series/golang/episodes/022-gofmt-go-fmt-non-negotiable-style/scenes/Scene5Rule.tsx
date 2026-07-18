import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileCode2, PenLine} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const FILE = {x: 450, y: 110};
const OK = {x: 260, y: 360};
const CHANGED = {x: 640, y: 360};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const fileIn = progress01(frame, 0, 18);
  const lineIn = progress01(frame, 16, 36);
  const okIn = progress01(frame, 34, 52);
  const changedIn = progress01(frame, 34, 52);

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
              x1={FILE.x}
              y1={FILE.y + 44}
              x2={FILE.x + (OK.x - FILE.x) * lineIn}
              y2={FILE.y + 44 + (OK.y - 40 - FILE.y - 44) * lineIn}
              stroke={COLORS.green}
              strokeWidth={2.4}
              opacity={0.6}
            />
            <line
              x1={FILE.x}
              y1={FILE.y + 44}
              x2={FILE.x + (CHANGED.x - FILE.x) * lineIn}
              y2={FILE.y + 44 + (CHANGED.y - 40 - FILE.y - 44) * lineIn}
              stroke={COLORS.red}
              strokeWidth={2.4}
              opacity={0.6}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: FILE.x,
              top: FILE.y,
              transform: `translate(-50%, -50%) scale(${0.9 + fileIn * 0.1})`,
              opacity: fileIn,
              padding: "16px 30px",
              borderRadius: 14,
              border: `2px solid ${COLORS.white}`,
              color: COLORS.white,
              fontFamily: FONTS.mono,
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            gofmt runs
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
            <Checkmark progress={okIn} size={78} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, textAlign: "center", maxWidth: 220}}>
              no changes
            </div>
            <div style={{color: COLORS.green, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
              already correct
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: CHANGED.x,
              top: CHANGED.y,
              transform: `translate(-50%, -50%) translateY(${(1 - changedIn) * 14}px)`,
              opacity: changedIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{position: "relative"}}>
              <FileCode2 size={78} color={COLORS.red} strokeWidth={1.6} />
              <div style={{position: "absolute", right: -14, bottom: -10}}>
                <PenLine size={34} color={COLORS.red} strokeWidth={2} />
              </div>
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700, textAlign: "center", maxWidth: 220}}>
              changes made
            </div>
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
              was wrong before
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
