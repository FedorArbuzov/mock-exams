import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Bug, ShieldCheck} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene4Verbose: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const leftIn = progress01(frame, 0, 20);
  const rightIn = progress01(frame, 44, 64);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 780,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={940} height={780}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 180,
              transform: `translate(-50%, -50%) translateY(${(1 - leftIn) * 12}px)`,
              opacity: leftIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <Bug size={78} color={COLORS.red} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, textAlign: "center"}}>
              other languages:
              <br />
              silent cast, prod incident
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 400,
              width: 940,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 560,
              transform: `translate(-50%, -50%) translateY(${(1 - rightIn) * 12}px)`,
              opacity: rightIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 14,
            }}
          >
            <ShieldCheck size={78} color={COLORS.green} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 34, fontWeight: 700, textAlign: "center"}}>
              Go: verbose, but that bug
              <br />
              never happens
            </div>
            <Checkmark progress={rightIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
