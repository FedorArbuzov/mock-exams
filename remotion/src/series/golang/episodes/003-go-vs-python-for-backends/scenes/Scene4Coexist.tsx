import React from "react";
import {AbsoluteFill, interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {GaugeIcon, ToolboxIcon} from "../../../../../shared/components/icons";
import {LangBadge} from "../../../icons/LangBadge";
import {clamp, progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ICON_W = 560;
const ICON_H = 435;

export const Scene4Coexist: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  const boxIn = progress01(frame, 0, 18);
  const slideIn = progress01(frame, 14, 34);
  const gaugeIn = progress01(frame, durationInFrames * 0.6, durationInFrames * 0.76);

  const pyX = interpolate(slideIn, [0, 1], [-260, 145], clamp);
  const goX = interpolate(slideIn, [0, 1], [820, 420], clamp);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 700,
          transform: `translate(-50%, -50%) scale(${0.9 + boxIn * 0.1})`,
          opacity: boxIn,
        }}
      >
        <div style={{position: "relative", width: ICON_W, height: ICON_H}}>
          <ToolboxIcon size={ICON_W} />

          <div
            style={{
              position: "absolute",
              left: pyX,
              top: 240,
              transform: "translate(-50%, -50%) scale(0.78)",
              opacity: slideIn,
            }}
          >
            <LangBadge label="Python" accent="#FBBF24" />
          </div>

          <div
            style={{
              position: "absolute",
              left: goX,
              top: 240,
              transform: "translate(-50%, -50%) scale(0.78)",
              opacity: slideIn,
            }}
          >
            <LangBadge label="Go" accent={COLORS.cyan} emphasis />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 1180,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          gap: 18,
          opacity: gaugeIn,
        }}
      >
        <GaugeIcon size={52} needleAngle={-55} color={COLORS.cyan} />
        <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 700}}>
          lighter
        </div>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
