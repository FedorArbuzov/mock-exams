import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Equal, X} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Habit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const badIn = progress01(frame, 0, 20);
  const goodIn = progress01(frame, 34, 54);
  const checkIn = progress01(frame, 58, 78);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={920} height={620}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 180,
              transform: `translate(-50%, -50%) translateY(${(1 - badIn) * 12}px)`,
              opacity: badIn,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "22px 28px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.red}66`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <X size={44} color={COLORS.red} strokeWidth={2} />
            <div style={{color: COLORS.red, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 750}}>
              err := do()
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 380,
              transform: `translate(-50%, -50%) translateY(${(1 - goodIn) * 12}px)`,
              opacity: goodIn,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "22px 28px",
              borderRadius: 14,
              border: `1.5px solid ${COLORS.green}88`,
              background: "rgba(15, 23, 42, 0.55)",
            }}
          >
            <Equal size={44} color={COLORS.green} strokeWidth={2} />
            <Checkmark progress={checkIn} size={44} />
            <div style={{color: COLORS.green, fontFamily: FONTS.mono, fontSize: 42, fontWeight: 750}}>
              err = do()
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
