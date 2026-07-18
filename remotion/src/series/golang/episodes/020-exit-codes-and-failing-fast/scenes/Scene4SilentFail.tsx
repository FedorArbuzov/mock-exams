import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Bug, CircleCheck, Server} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4SilentFail: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const step1 = progress01(frame, 0, 18);
  const arrow1 = progress01(frame, 18, 30);
  const step2 = progress01(frame, 28, 46);
  const arrow2 = progress01(frame, 46, 58);
  const step3 = progress01(frame, 56, 74);
  const warnIn = progress01(frame, 74, 92);
  const bugPulse = 0.5 + 0.5 * Math.sin(frame * 0.2);

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
        <Panel width={940} height={560}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 100,
              width: 940,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            <div style={{opacity: step1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
              <Server size={78} color={COLORS.muted} strokeWidth={1.6} />
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, textAlign: "center", maxWidth: 160}}>
                job fails inside
              </div>
            </div>

            <div style={{opacity: arrow1}}>
              <Arrow direction="right" size={40} color={COLORS.muted} />
            </div>

            <div style={{opacity: step2, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
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
                  fontSize: 40,
                  fontWeight: 800,
                }}
              >
                0
              </div>
              <div
                style={{
                  position: "absolute",
                  right: -6,
                  top: -6,
                  opacity: 0.6 + bugPulse * 0.4,
                }}
              >
                <Bug size={34} color={COLORS.red} strokeWidth={1.8} />
              </div>
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
                exits anyway
              </div>
            </div>

            <div style={{opacity: arrow2}}>
              <Arrow direction="right" size={40} color={COLORS.muted} />
            </div>

            <div style={{opacity: step3, display: "flex", flexDirection: "column", alignItems: "center", gap: 12}}>
              <CircleCheck size={78} color={COLORS.green} strokeWidth={1.6} />
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700, textAlign: "center", maxWidth: 160}}>
                pipeline: success
              </div>
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 400,
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              opacity: warnIn,
              width: 780,
              justifyContent: "center",
            }}
          >
            <Bug size={40} color={COLORS.red} strokeWidth={1.8} />
            <div style={{color: COLORS.red, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 750, textAlign: "center"}}>
              silent production bug
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
