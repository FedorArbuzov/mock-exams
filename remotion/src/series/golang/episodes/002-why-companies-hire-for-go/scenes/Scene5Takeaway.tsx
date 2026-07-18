import React, {useMemo} from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Binary} from "../../../icons/Binary";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene5Takeaway: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const orbiters = useMemo(() => [0, 1, 2, 3, 4, 5], []);
  const labelsIn = progress01(frame, 16, 34);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{position: "relative", width: 340, height: 340}}>
        {orbiters.map((i) => {
          const angle = (frame * 1.6 + i * 60) % 360;
          const rad = (angle * Math.PI) / 180;
          const radius = 150;
          const x = 170 + Math.cos(rad) * radius;
          const y = 170 + Math.sin(rad) * radius;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: x - 6,
                top: y - 6,
                width: 12,
                height: 12,
                borderRadius: 99,
                background: COLORS.cyan,
                boxShadow: `0 0 12px ${COLORS.glowCyan}`,
              }}
            />
          );
        })}
        <div style={{position: "absolute", left: 105, top: 105}}>
          <Binary label="app" size={130} />
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: -20,
            transform: "translateX(-50%)",
            color: COLORS.cyan,
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 700,
            opacity: labelsIn,
            textShadow: `0 0 10px ${COLORS.glowCyan}`,
          }}
        >
          goroutines
        </div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -46,
            transform: "translateX(-50%)",
            color: COLORS.white,
            fontFamily: FONTS.sans,
            fontSize: 22,
            fontWeight: 700,
            opacity: labelsIn,
          }}
        >
          1 binary
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
