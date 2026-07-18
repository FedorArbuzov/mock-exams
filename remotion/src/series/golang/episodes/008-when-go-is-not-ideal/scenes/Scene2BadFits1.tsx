import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {WindowIcon, XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ScriptIcon: React.FC<{size: number; color: string}> = ({size, color}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M12 6h18l8 8v28a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke={color} strokeWidth="2.2" strokeLinejoin="round" />
    <path d="M17 24h14M17 31h14M17 17h6" stroke={color} strokeWidth="2" opacity="0.7" />
  </svg>
);

const ITEMS = [
  {Icon: ScriptIcon, label: "10-line script", x: 220},
  {Icon: WindowIcon, label: "complex desktop UI", x: 540},
  {Icon: null, label: "team already expert", x: 860},
];

export const Scene2BadFits1: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {ITEMS.map((item, i) => {
        const delay = 8 + i * 16;
        const xIn = progress01(frame, delay + 20, delay + 34);
        const Icon = item.Icon;
        return (
          <div
            key={item.label}
            style={{
              position: "absolute",
              left: item.x,
              top: 720,
              transform: `translate(-50%, -50%) translateY(${(1 - fadeSlideUp(frame, delay, 16).opacity) * 20}px)`,
              opacity: fadeSlideUp(frame, delay, 16).opacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div style={{position: "relative", width: 56, height: 56}}>
              {Icon ? (
                <Icon size={56} color={COLORS.muted} />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 99,
                    border: `2px solid ${COLORS.muted}`,
                  }}
                />
              )}
              <div style={{position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", opacity: xIn}}>
                <XMarkGlyph size={56} />
              </div>
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 620, maxWidth: 180, textAlign: "center"}}>
              {item.label}
            </div>
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
