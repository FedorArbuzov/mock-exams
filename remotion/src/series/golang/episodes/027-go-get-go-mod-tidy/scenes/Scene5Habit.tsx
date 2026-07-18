import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {FileWarning} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Habit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const row1 = progress01(frame, 0, 18);
  const icon1 = progress01(frame, 14, 30);
  const row2 = progress01(frame, 26, 44);
  const icon2 = progress01(frame, 40, 56);

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
        <Panel width={880} height={500}>
          <div
            style={{
              position: "absolute",
              left: 40,
              top: 70,
              width: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: row1,
              transform: `translateY(${(1 - row1) * 12}px)`,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 28, fontWeight: 700}}>
              tidy before commit
            </div>
            <div style={{opacity: icon1}}>
              <Checkmark progress={icon1} size={70} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 40,
              top: 340,
              width: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              opacity: row2,
              transform: `translateY(${(1 - row2) * 12}px)`,
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 28, fontWeight: 700, maxWidth: 560}}>
              hand-edit checksums
            </div>
            <div style={{opacity: icon2}}>
              <FileWarning size={64} color={COLORS.red} strokeWidth={1.7} />
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
