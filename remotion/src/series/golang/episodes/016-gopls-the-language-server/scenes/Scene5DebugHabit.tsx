import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {AppWindow, CheckCircle2, ShieldCheck, SquareTerminal, XCircle} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const LEFT = {x: 240, y: 200};
const RIGHT = {x: 620, y: 200};
const VERDICT = {x: 430, y: 560};

export const Scene5DebugHabit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const rightIn = progress01(frame, 12, 30);
  const lineIn = progress01(frame, 30, 50);
  const verdictIn = progress01(frame, 46, 66);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 850,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={860} height={760}>
          <svg width={860} height={760} style={{position: "absolute"}}>
            <line
              x1={LEFT.x}
              y1={LEFT.y + 70}
              x2={LEFT.x + (VERDICT.x - LEFT.x) * lineIn}
              y2={LEFT.y + 70 + (VERDICT.y - 60 - LEFT.y - 70) * lineIn}
              stroke={COLORS.red}
              strokeWidth={2.4}
              opacity={0.6}
            />
            <line
              x1={RIGHT.x}
              y1={RIGHT.y + 70}
              x2={RIGHT.x + (VERDICT.x - RIGHT.x) * lineIn}
              y2={RIGHT.y + 70 + (VERDICT.y - 60 - RIGHT.y - 70) * lineIn}
              stroke={COLORS.green}
              strokeWidth={2.4}
              opacity={0.6}
            />
          </svg>

          <div
            style={{
              position: "absolute",
              left: LEFT.x,
              top: LEFT.y,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 16}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{position: "relative"}}>
              <AppWindow size={120} color={COLORS.muted} strokeWidth={1.6} />
              <div style={{position: "absolute", right: -18, top: -18}}>
                <XCircle size={48} color={COLORS.red} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              editor
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: RIGHT.x,
              top: RIGHT.y,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 16}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <div style={{position: "relative"}}>
              <SquareTerminal size={120} color={COLORS.muted} strokeWidth={1.6} />
              <div style={{position: "absolute", right: -18, top: -18}}>
                <CheckCircle2 size={48} color={COLORS.green} fill={COLORS.background} strokeWidth={1.8} />
              </div>
            </div>
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              go build
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: VERDICT.x,
              top: VERDICT.y,
              transform: `translate(-50%, -50%) scale(${0.9 + verdictIn * 0.1})`,
              opacity: verdictIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              width: 620,
            }}
          >
            <ShieldCheck size={82} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 28, fontWeight: 750}}>
              trust go build
            </div>
            <div
              style={{
                color: COLORS.muted,
                fontFamily: FONTS.sans,
                fontSize: 20,
                fontWeight: 600,
                textAlign: "center",
              }}
            >
              then fix the gopls workspace
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
