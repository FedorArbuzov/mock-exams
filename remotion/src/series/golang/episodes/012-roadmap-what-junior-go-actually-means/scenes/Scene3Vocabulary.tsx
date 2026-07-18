import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const WORDS = ["structs", "slices", "maps", "interfaces", "context"];

export const Scene3Vocabulary: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const trapIn = progress01(frame, durationInFrames * 0.5, durationInFrames * 0.68);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 620,
          transform: "translateX(-50%)",
          width: 820,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 18,
        }}
      >
        {WORDS.map((w, i) => {
          const wordIn = progress01(frame, 6 + i * 10, 6 + i * 10 + 14);
          return (
            <div
              key={w}
              style={{
                ...fadeSlideUp(frame, 6 + i * 10, 14),
                padding: "14px 24px",
                borderRadius: 999,
                border: `1.5px solid ${COLORS.cyan}`,
                color: COLORS.cyan,
                fontFamily: FONTS.mono,
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              {w}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 950,
          transform: "translate(-50%, -50%)",
          opacity: trapIn,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div
          style={{
            width: 220,
            height: 110,
            borderRadius: 16,
            border: `2px dashed ${COLORS.red}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: COLORS.red,
            fontFamily: FONTS.mono,
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          nil interface
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
