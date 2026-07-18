import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const HABITS = ["name for what it does", "return errors", "delete unused abstractions"];

export const Scene5DailyHabit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {HABITS.map((h, i) => {
        const delay = 10 + i * 22;
        const rowIn = progress01(frame, delay, delay + 14);
        const checkIn = progress01(frame, delay + 12, delay + 26);
        return (
          <div
            key={h}
            style={{
              position: "absolute",
              left: "50%",
              top: 640 + i * 130,
              transform: `translate(-50%, -50%) translateY(${(1 - rowIn) * 16}px)`,
              opacity: rowIn,
              display: "flex",
              alignItems: "center",
              gap: 22,
              width: 620,
              justifyContent: "space-between",
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 680}}>
              {h}
            </div>
            <Checkmark progress={checkIn} size={44} />
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
