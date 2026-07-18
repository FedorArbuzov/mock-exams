import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {GearIcon, WindowIcon} from "../../../../../shared/components/icons";
import {GoLogo} from "../../../icons/GoLogo";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ITEMS: {label: string; render: () => React.ReactNode}[] = [
  {label: "go version works", render: () => <GoLogo size={76} glow={false} />},
  {label: "GOROOT points at install", render: () => <GearIcon size={76} color={COLORS.cyan} />},
  {label: "editor sees same binary", render: () => <WindowIcon size={76} color={COLORS.cyan} />},
];

export const Scene5FirstHour: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {ITEMS.map((item, i) => {
        const delay = 10 + i * 26;
        const rowIn = progress01(frame, delay, delay + 14);
        const checkIn = progress01(frame, delay + 12, delay + 28);
        return (
          <div
            key={item.label}
            style={{
              position: "absolute",
              left: "50%",
              top: 560 + i * 200,
              transform: `translate(-50%, -50%) translateY(${(1 - rowIn) * 16}px)`,
              opacity: rowIn,
              display: "flex",
              alignItems: "center",
              gap: 28,
              width: 760,
              justifyContent: "space-between",
            }}
          >
            <div style={{display: "flex", alignItems: "center", gap: 24}}>
              {item.render()}
              <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 26, fontWeight: 680}}>
                {item.label}
              </div>
            </div>
            <Checkmark progress={checkIn} size={78} />
          </div>
        );
      })}

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
