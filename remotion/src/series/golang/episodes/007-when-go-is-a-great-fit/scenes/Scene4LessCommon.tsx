import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {BrainIcon, WindowIcon, XMarkGlyph} from "../../../../../shared/components/icons";
import {fadeSlideUp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS = [
  {Icon: WindowIcon, label: "desktop GUIs", x: 220},
  {Icon: BrainIcon, label: "ML training", x: 540},
  {Icon: null, label: "owned ecosystems", x: 860},
];

export const Scene4LessCommon: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {ITEMS.map((item, i) => {
        const delay = 8 + i * 16;
        const iconIn = progress01(frame, delay, delay + 16);
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
                    borderRadius: 10,
                    border: `2px solid ${COLORS.muted}`,
                  }}
                />
              )}
              <div style={{position: "absolute", left: "50%", top: "50%", opacity: xIn * iconIn}}>
                <div style={{transform: "translate(-50%, -50%)"}}>
                  <XMarkGlyph size={56} />
                </div>
              </div>
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 19, fontWeight: 620}}>
              {item.label}
            </div>
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
