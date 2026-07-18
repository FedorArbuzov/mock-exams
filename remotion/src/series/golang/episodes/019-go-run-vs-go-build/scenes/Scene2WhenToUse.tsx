import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Hammer, Package, Play, Zap} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const COLUMN_STYLE: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 18,
};

export const Scene2WhenToUse: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const leftArrow1 = progress01(frame, 18, 30);
  const leftBox = progress01(frame, 28, 42);
  const leftArrow2 = progress01(frame, 42, 54);
  const leftEnd = progress01(frame, 52, 66);

  const rightIn = progress01(frame, 10, 28);
  const rightArrow1 = progress01(frame, 28, 40);
  const rightBox = progress01(frame, 38, 52);
  const rightArrow2 = progress01(frame, 52, 64);
  const rightEnd = progress01(frame, 62, 76);

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
        <Panel width={880} height={660}>
          <div style={{position: "absolute", left: 0, top: 50, width: 880, display: "flex", justifyContent: "space-evenly"}}>
            <div style={COLUMN_STYLE}>
              <div style={{opacity: leftIn}}>
                <Play size={84} color={COLORS.green} strokeWidth={1.6} />
              </div>
              <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700, opacity: leftIn}}>
                go run
              </div>
              <div style={{opacity: leftArrow1}}>
                <Arrow direction="down" size={40} color={COLORS.green} />
              </div>
              <div
                style={{
                  opacity: leftBox,
                  padding: "14px 22px",
                  borderRadius: 12,
                  border: `2px dashed ${COLORS.muted}`,
                  color: COLORS.muted,
                  fontFamily: FONTS.sans,
                  fontSize: 20,
                  fontWeight: 650,
                }}
              >
                temp binary
              </div>
              <div style={{opacity: leftArrow2}}>
                <Arrow direction="down" size={40} color={COLORS.green} />
              </div>
              <div style={{opacity: leftEnd, display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
                <Zap size={60} color={COLORS.green} strokeWidth={1.7} />
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                  runs now
                </div>
              </div>
            </div>

            <div style={COLUMN_STYLE}>
              <div style={{opacity: rightIn}}>
                <Hammer size={84} color={COLORS.cyan} strokeWidth={1.6} />
              </div>
              <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 24, fontWeight: 700, opacity: rightIn}}>
                go build
              </div>
              <div style={{opacity: rightArrow1}}>
                <Arrow direction="down" size={40} color={COLORS.cyan} />
              </div>
              <div
                style={{
                  opacity: rightBox,
                  padding: "14px 22px",
                  borderRadius: 12,
                  border: `2px solid ${COLORS.cyan}`,
                  background: "rgba(34,211,238,0.08)",
                  color: COLORS.cyan,
                  fontFamily: FONTS.sans,
                  fontSize: 20,
                  fontWeight: 650,
                }}
              >
                binary
              </div>
              <div style={{opacity: rightArrow2}}>
                <Arrow direction="down" size={40} color={COLORS.cyan} />
              </div>
              <div style={{opacity: rightEnd, display: "flex", flexDirection: "column", alignItems: "center", gap: 10}}>
                <Package size={60} color={COLORS.white} strokeWidth={1.7} />
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                  ship it
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
