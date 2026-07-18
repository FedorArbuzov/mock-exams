import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {ChatQuestion} from "../../../../../shared/components/icons";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const SpawnGlyph: React.FC<{color: string}> = ({color}) => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <circle cx="18" cy="24" r="9" stroke={color} strokeWidth="2.5" />
    <circle cx="34" cy="24" r="4" fill={color} opacity="0.85" />
    <path d="M27 24h4" stroke={color} strokeWidth="2" opacity="0.7" />
  </svg>
);

const BrokenLinkGlyph: React.FC<{color: string}> = ({color}) => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M14 20l-4 4a6 6 0 0 0 8 8l4-4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M34 28l4-4a6 6 0 0 0-8-8l-4 4" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <path d="M10 10l28 28" stroke={color} strokeWidth="2" opacity="0.6" />
  </svg>
);

const WarningGlyph: React.FC<{color: string}> = ({color}) => (
  <svg width="46" height="46" viewBox="0 0 48 48" fill="none">
    <path d="M24 8l18 32H6z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M24 20v9" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="24" cy="34" r="1.8" fill={color} />
  </svg>
);

const STEPS: Array<{label: string; render: (color: string) => React.ReactNode}> = [
  {label: "spawn", render: (c) => <SpawnGlyph color={c} />},
  {label: "no cleanup", render: (c) => <BrokenLinkGlyph color={c} />},
  {label: "leak", render: (c) => <WarningGlyph color={c} />},
];

export const Scene4Interview: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const cardIn = progress01(frame, durationInFrames * 0.62, durationInFrames * 0.8);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 680,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {STEPS.map((step, i) => {
          const start = 8 + i * 26;
          const boxIn = progress01(frame, start, start + 16);
          const isLeak = step.label === "leak";
          const color = isLeak && boxIn > 0.6 ? COLORS.red : COLORS.cyan;
          return (
            <React.Fragment key={step.label}>
              {i > 0 ? (
                <div
                  style={{
                    width: 30,
                    height: 2,
                    background: COLORS.border,
                    opacity: progress01(frame, start - 12, start),
                  }}
                />
              ) : null}
              <div
                style={{
                  width: 168,
                  height: 168,
                  borderRadius: 18,
                  border: `1.5px solid ${color}`,
                  background: COLORS.card,
                  boxShadow: isLeak && boxIn > 0.6 ? "0 0 26px rgba(248,113,113,0.45)" : `0 0 20px ${COLORS.glowCyan}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  opacity: interpolate(boxIn, [0, 0.3], [0, 1], clamp),
                  transform: `scale(${0.85 + boxIn * 0.15})`,
                }}
              >
                {step.render(color)}
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
                  {step.label}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1180,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: 20,
          opacity: cardIn,
        }}
      >
        <ChatQuestion size={56} />
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 620}}>
          interview signal
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
