import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Check: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const a = progress01(frame, 0, 22);
  const b = progress01(frame, 30, 52);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={920} height={720}>
          <div style={{position: "absolute", left: "50%", top: 180, transform: `translate(-50%, -50%) translateY(${(1 - a) * 12}px)`, opacity: a, padding: "22px 28px", borderRadius: 14, border: `1.5px solid ${COLORS.cyan}`, background: "rgba(15, 23, 42, 0.55)", boxShadow: `0 0 20px ${COLORS.glowCyan}`}}>
            <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 780}}>edit, then Git</div>
          </div>
          <div style={{position: "absolute", left: "50%", top: 380, transform: `translate(-50%, -50%) translateY(${(1 - b) * 12}px)`, opacity: b, display: "flex", gap: 24, alignItems: "center"}}>
            <div style={{padding: "22px 28px", borderRadius: 14, border: `1.5px solid ${COLORS.green}`, background: "rgba(15, 23, 42, 0.55)", minWidth: 240, textAlign: "center"}}>
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 720, marginBottom: 10}}>do</div>
              <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 800}}>commit the change</div>
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.mono, fontSize: 44, fontWeight: 800}}>vs</div>
            <div style={{padding: "22px 28px", borderRadius: 14, border: `1.5px solid ${COLORS.red}`, background: "rgba(15, 23, 42, 0.55)", minWidth: 240, textAlign: "center"}}>
              <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 720, marginBottom: 10}}>avoid</div>
              <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 38, fontWeight: 800}}>edit = source of truth</div>
            </div>
          </div>
          <div style={{position: "absolute", left: "50%", top: 560, transform: "translate(-50%, -50%)", opacity: progress01(frame, 58, 78), color: COLORS.white, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 720, textAlign: "center", width: 780, lineHeight: 1.4}}>
            apply can overwrite you
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
