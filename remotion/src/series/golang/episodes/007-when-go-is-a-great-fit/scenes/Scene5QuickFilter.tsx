import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const CRITERIA = ["network-bound", "long-running", "team-maintained"];

export const Scene5QuickFilter: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {CRITERIA.map((c, i) => {
        const delay = 10 + i * 22;
        const rowIn = progress01(frame, delay, delay + 14);
        const checkIn = progress01(frame, delay + 12, delay + 26);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              left: "50%",
              top: 640 + i * 130,
              transform: `translate(-50%, -50%) translateY(${(1 - rowIn) * 16}px)`,
              opacity: rowIn,
              display: "flex",
              alignItems: "center",
              gap: 22,
              width: 480,
              justifyContent: "space-between",
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 28, fontWeight: 680}}>
              {c}
            </div>
            <Checkmark progress={checkIn} size={48} />
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
