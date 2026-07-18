import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const INDICATORS = ["errors inline", "go test runs", "fmt on save"];

export const Scene5SetupDone: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const frameIn = progress01(frame, 0, 18);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 720,
          transform: `translate(-50%, -50%) scale(${0.92 + frameIn * 0.08})`,
          opacity: frameIn,
          width: 820,
          borderRadius: 20,
          border: `1.5px solid ${COLORS.border}`,
          background: "rgba(7, 12, 24, 0.95)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            padding: "14px 18px",
            borderBottom: `1px solid ${COLORS.border}`,
            background: "rgba(15,23,42,0.9)",
          }}
        >
          {["#F87171", "#FBBF24", "#34D399"].map((c) => (
            <div key={c} style={{width: 12, height: 12, borderRadius: 99, background: c}} />
          ))}
        </div>
        <div style={{height: 220}} />
        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          {INDICATORS.map((label, i) => {
            const delay = 20 + i * 20;
            const lit = progress01(frame, delay, delay + 14);
            return (
              <div
                key={label}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "18px 16px",
                  borderRight: i < INDICATORS.length - 1 ? `1px solid ${COLORS.border}` : undefined,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 99,
                    background: COLORS.green,
                    opacity: 0.3 + lit * 0.7,
                    boxShadow: lit > 0.5 ? `0 0 10px ${COLORS.green}` : "none",
                  }}
                />
                <div
                  style={{
                    color: COLORS.white,
                    fontFamily: FONTS.mono,
                    fontSize: 18,
                    fontWeight: 600,
                    opacity: 0.5 + lit * 0.5,
                  }}
                >
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
