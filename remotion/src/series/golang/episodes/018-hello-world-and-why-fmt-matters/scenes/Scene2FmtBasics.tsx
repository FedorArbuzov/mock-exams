import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const codeCard = (w: number) => ({
  width: w,
  borderRadius: 14,
  border: `1.5px solid ${COLORS.border}`,
  background: "rgba(7,12,24,0.9)",
  padding: "18px 20px",
  fontFamily: FONTS.mono,
  fontSize: 21,
});

export const Scene2FmtBasics: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 18);
  const leftArrow = progress01(frame, 20, 36);
  const leftOut = progress01(frame, 34, 52);
  const rightIn = progress01(frame, 24, 42);
  const rightArrow = progress01(frame, 46, 62);
  const rightOut = progress01(frame, 60, 78);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 860,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={900} height={480}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 80,
              opacity: leftIn,
              transform: `translateY(${(1 - leftIn) * 12}px)`,
            }}
          >
            <div style={codeCard(360)}>
              <span style={{color: COLORS.cyan}}>fmt.Println</span>
              <span style={{color: COLORS.white}}>(</span>
              <span style={{color: COLORS.green}}>&quot;hi&quot;</span>
              <span style={{color: COLORS.white}}>)</span>
            </div>
          </div>

          <div style={{position: "absolute", left: 200, top: 210, opacity: leftArrow}}>
            <Arrow direction="down" size={54} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 290,
              opacity: leftOut,
              transform: `translateY(${(1 - leftOut) * 12}px)`,
            }}
          >
            <div style={{...codeCard(360), borderColor: `${COLORS.green}66`}}>
              <span style={{color: COLORS.white}}>hi</span>
            </div>
          </div>

          <div style={{position: "absolute", left: 40, top: 400, color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 650, opacity: leftOut}}>
            simple output
          </div>

          <div
            style={{
              position: "absolute",
              left: 460,
              top: 80,
              opacity: rightIn,
              transform: `translateY(${(1 - rightIn) * 12}px)`,
            }}
          >
            <div style={codeCard(400)}>
              <span style={{color: COLORS.cyan}}>fmt.Printf</span>
              <span style={{color: COLORS.white}}>(</span>
              <span style={{color: COLORS.green}}>&quot;</span>
              <span style={{color: COLORS.cyan}}>%s</span>
              <span style={{color: COLORS.green}}>-</span>
              <span style={{color: COLORS.cyan}}>%d</span>
              <span style={{color: COLORS.green}}>&quot;</span>
              <span style={{color: COLORS.white}}>, lang, n)</span>
            </div>
          </div>

          <div style={{position: "absolute", left: 620, top: 210, opacity: rightArrow}}>
            <Arrow direction="down" size={54} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 460,
              top: 290,
              opacity: rightOut,
              transform: `translateY(${(1 - rightOut) * 12}px)`,
            }}
          >
            <div style={{...codeCard(400), borderColor: `${COLORS.green}66`}}>
              <span style={{color: COLORS.cyan}}>go</span>
              <span style={{color: COLORS.white}}>-</span>
              <span style={{color: COLORS.cyan}}>7</span>
            </div>
          </div>

          <div style={{position: "absolute", left: 460, top: 400, color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 650, opacity: rightOut}}>
            formatted with verbs
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
