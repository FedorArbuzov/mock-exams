import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ROWS = ["Uber", "Cloudflare", "Dropbox", "Twitch"];
const ROW_HEIGHT = 140;
const LIST_TOP = 560;

export const Scene2Companies: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 380,
          transform: `translateX(-50%) translateY(${(1 - fadeSlideUp(frame, 0, 16).opacity) * 20}px)`,
          opacity: fadeSlideUp(frame, 0, 16).opacity,
          color: COLORS.muted,
          fontFamily: FONTS.mono,
          fontSize: 24,
          fontWeight: 650,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        status: live
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: LIST_TOP,
          transform: "translateX(-50%)",
          width: 780,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {ROWS.map((label, i) => {
          const delay = 20 + i * 18;
          const rowIn = progress01(frame, delay, delay + 14);
          const pillIn = progress01(frame, delay + 10, delay + 24);
          return (
            <div
              key={label}
              style={{
                height: ROW_HEIGHT - 20,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 32px",
                borderRadius: 16,
                border: `1.5px solid ${COLORS.border}`,
                background: COLORS.card,
                opacity: rowIn,
                transform: `translateY(${(1 - rowIn) * 14}px)`,
              }}
            >
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 30, fontWeight: 700}}>
                {label}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  opacity: pillIn,
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "rgba(52, 211, 153, 0.12)",
                  border: `1px solid ${COLORS.green}`,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 99,
                    background: COLORS.green,
                    boxShadow: `0 0 8px ${COLORS.green}`,
                  }}
                />
                <div style={{color: COLORS.green, fontSize: 20, fontWeight: 700}}>Operational</div>
              </div>
            </div>
          );
        })}
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
