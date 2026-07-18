import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {clamp, fadeSlideUp, progress01} from "../../../../../shared/utils/animations";
import {interpolate} from "remotion";

type Props = {text: string; durationInFrames: number};

const Hexagon: React.FC<{color: string; size: number}> = ({color, size}) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <path d="M24 4l17 10v20l-17 10-17-10V14z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

export const Scene3Implicit: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const keywordType = Math.round(
    interpolate(frame, [10, 40], [0, "implements Foo".length], clamp),
  );
  const dashIn = progress01(frame, 42, 58);

  const methodsIn = progress01(frame, 10, 30);
  const snap = progress01(frame, 34, 52);
  const checkIn = progress01(frame, 54, 68);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 90,
          top: 620,
          width: 340,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          ...fadeSlideUp(frame, 0, 16),
        }}
      >
        <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
          Java
        </div>
        <div
          style={{
            color: COLORS.muted,
            fontFamily: FONTS.mono,
            fontSize: 24,
            minHeight: 32,
          }}
        >
          {"implements Foo".slice(0, keywordType)}
        </div>
        <div
          style={{
            width: 60,
            height: 1,
            background: COLORS.muted,
            opacity: dashIn,
            borderTop: `2px dashed ${COLORS.muted}`,
          }}
        />
        <div style={{opacity: dashIn}}>
          <Hexagon color={COLORS.muted} size={56} />
        </div>
        <div style={{color: COLORS.muted, fontSize: 20, opacity: dashIn}}>Foo</div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 90,
          top: 620,
          width: 340,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          ...fadeSlideUp(frame, 6, 16),
        }}
      >
        <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
          Go
        </div>
        <div style={{display: "flex", gap: 10, opacity: methodsIn}}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 99,
                background: COLORS.cyan,
                transform: `translateY(${(1 - snap) * -10}px)`,
              }}
            />
          ))}
        </div>
        <div style={{opacity: snap}}>
          <Hexagon color={COLORS.cyan} size={56} />
        </div>
        <div style={{opacity: checkIn, marginTop: -6}}>
          <Checkmark progress={checkIn} size={40} />
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
