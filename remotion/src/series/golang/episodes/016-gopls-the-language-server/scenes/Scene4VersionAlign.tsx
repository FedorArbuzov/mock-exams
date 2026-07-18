import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Settings2} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4VersionAlign: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const gearsIn = progress01(frame, 0, 20);
  const checkIn = progress01(frame, durationInFrames * 0.45, durationInFrames * 0.65);
  const spin = frame * 1.1;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 880,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={820} height={900}>
          <div
            style={{
              position: "absolute",
              left: 260,
              top: 220,
              transform: `translate(-50%, -50%) rotate(${spin}deg) scale(${0.9 + gearsIn * 0.1})`,
              opacity: gearsIn,
            }}
          >
            <Settings2 size={170} color={COLORS.cyan} strokeWidth={1.5} />
          </div>
          <div
            style={{
              position: "absolute",
              left: 460,
              top: 300,
              transform: `translate(-50%, -50%) rotate(${-spin * 0.94}deg) scale(${0.9 + gearsIn * 0.1})`,
              opacity: gearsIn,
            }}
          >
            <Settings2 size={130} color={COLORS.green} strokeWidth={1.5} />
          </div>

          <div
            style={{
              position: "absolute",
              left: 200,
              top: 480,
              color: COLORS.cyan,
              fontFamily: FONTS.mono,
              fontSize: 26,
              fontWeight: 700,
              opacity: gearsIn,
            }}
          >
            go 1.23
          </div>
          <div
            style={{
              position: "absolute",
              left: 380,
              top: 560,
              color: COLORS.green,
              fontFamily: FONTS.mono,
              fontSize: 26,
              fontWeight: 700,
              opacity: gearsIn,
            }}
          >
            gopls v0.16
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 720,
              transform: "translate(-50%, -50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              opacity: checkIn,
            }}
          >
            <Checkmark progress={checkIn} size={78} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 24, fontWeight: 700}}>
              kept in sync
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
