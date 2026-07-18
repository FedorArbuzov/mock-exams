import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {ServerIcon} from "../../../../../shared/components/icons";
import {Binary} from "../../../icons/Binary";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const STEP_X = [190, 540, 890];
const STEP_LABELS = ["compile", "ship", "run"];

export const Scene5Mental: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div style={{position: "absolute", left: 0, top: 770, width: "100%", height: 2}}>
        {[0, 1].map((i) => {
          const start = 10 + i * 40;
          const lineIn = progress01(frame, start, start + 22);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: STEP_X[i] + 40,
                top: 0,
                width: (STEP_X[i + 1] - STEP_X[i] - 80) * lineIn,
                height: 2,
                background: COLORS.cyan,
                boxShadow: `0 0 8px ${COLORS.glowCyan}`,
              }}
            />
          );
        })}
      </div>

      {STEP_X.map((x, i) => {
        const start = 4 + i * 40;
        const iconIn = progress01(frame, start, start + 18);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: 780,
              transform: `translate(-50%, -50%) scale(${0.7 + iconIn * 0.3})`,
              opacity: iconIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            {i === 0 ? (
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 16,
                  border: `2px solid ${COLORS.cyan}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: FONTS.mono,
                  color: COLORS.cyan,
                  fontSize: 30,
                }}
              >
                {">_"}
              </div>
            ) : i === 1 ? (
              <Binary label="" size={90} />
            ) : (
              <div style={{display: "flex", gap: 8}}>
                <ServerIcon size={42} />
                <ServerIcon size={42} />
              </div>
            )}
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 680}}>
              {STEP_LABELS[i]}
            </div>
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
