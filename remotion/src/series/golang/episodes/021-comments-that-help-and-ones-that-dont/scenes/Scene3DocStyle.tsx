import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileText} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene3DocStyle: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const codeIn = progress01(frame, 0, 18);
  const arrowIn = progress01(frame, 24, 40);
  const docIn = progress01(frame, 38, 56);

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
        <Panel width={700} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 130,
              transform: "translate(-50%, -50%)",
              opacity: codeIn,
              width: 560,
              borderRadius: 16,
              border: `1.5px solid ${COLORS.green}66`,
              background: "rgba(7,12,24,0.9)",
              padding: "22px 26px",
              fontFamily: FONTS.mono,
              fontSize: 22,
              lineHeight: 1.6,
            }}
          >
            <div style={{color: COLORS.green}}>// ParseConfig reads</div>
            <div style={{color: COLORS.green}}>// the config file</div>
            <div style={{color: COLORS.white, marginTop: 4}}>
              <span style={{color: COLORS.cyan}}>func</span> ParseConfig(path string)
            </div>
          </div>

          <div style={{position: "absolute", left: "50%", top: 300, transform: "translate(-50%, 0)", opacity: arrowIn}}>
            <Arrow direction="down" size={54} color={COLORS.cyan} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: `translate(-50%, -50%) scale(${0.92 + docIn * 0.08})`,
              opacity: docIn,
              width: 460,
              borderRadius: 18,
              border: `2px solid ${COLORS.cyan}`,
              background: "rgba(34,211,238,0.06)",
              boxShadow: `0 0 26px ${COLORS.glowCyan}`,
              padding: "26px 30px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <FileText size={64} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 750}}>
              your generated docs
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
