import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Rule: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const ruleIn = progress01(frame, 8, 36);
  const subIn = progress01(frame, 40, 68);

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: "50%", top: 780, transform: "translate(-50%, -50%)"}}>
        <Panel width={920} height={620} accent={COLORS.green}>
          <div style={{position: "absolute", left: "50%", top: "38%", transform: `translate(-50%, -50%) translateY(${(1 - ruleIn) * 14}px)`, opacity: ruleIn, textAlign: "center", width: 820}}>
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 44, fontWeight: 800, lineHeight: 1.35, textShadow: `0 0 20px ${COLORS.glowGreen}`}}>
              current-context first
            </div>
          </div>
          <div style={{position: "absolute", left: "50%", top: "62%", transform: `translate(-50%, -50%) translateY(${(1 - subIn) * 12}px)`, opacity: subIn, textAlign: "center", width: 780, color: COLORS.white, fontFamily: FONTS.sans, fontSize: 38, fontWeight: 720, lineHeight: 1.4}}>
            every apply, no exceptions
          </div>
        </Panel>
      </div>
      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
