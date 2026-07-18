import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Define: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const a = progress01(frame, 0, 24);
  const b = progress01(frame, 30, 52);
  const c = progress01(frame, 56, 78);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={960} height={720}>
          <div style={{position: "absolute", left: 240, top: 280, transform: `translate(-50%, -50%) translateY(${(1 - a) * 12}px)`, opacity: a, padding: "24px 32px", borderRadius: 14, border: `1.5px solid ${COLORS.cyan}`, background: "rgba(15, 23, 42, 0.55)"}}>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 720, marginBottom: 12}}>Events</div>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 40, fontWeight: 780}}>orchestration</div>
          </div>
          <div style={{position: "absolute", left: 480, top: 280, opacity: b}}>
            <Arrow direction="right" size={48} color={COLORS.cyan} />
          </div>
          <div style={{position: "absolute", left: 720, top: 280, transform: `translate(-50%, -50%) translateY(${(1 - b) * 12}px)`, opacity: b, padding: "24px 32px", borderRadius: 14, border: `1.5px solid ${COLORS.green}`, background: "rgba(15, 23, 42, 0.55)", boxShadow: `0 0 20px ${COLORS.glowGreen}`}}>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 36, fontWeight: 720, marginBottom: 12}}>logs</div>
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 40, fontWeight: 780}}>the app</div>
          </div>
          <div style={{position: "absolute", left: "50%", top: 520, transform: `translate(-50%, -50%) translateY(${(1 - c) * 12}px)`, opacity: c, color: COLORS.white, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 720, textAlign: "center", width: 820, lineHeight: 1.4}}>
            two different questions
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
