import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {HelpCircle, RefreshCw, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const FLAGS = [
  {label: "surprise replace directives", Icon: RefreshCw},
  {label: "mystery indirect deps", Icon: HelpCircle},
];

export const Scene3AlsoCheck: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const ciIn = progress01(frame, 82, 102);

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
          {FLAGS.map((f, i) => {
            const delay = 10 + i * 30;
            const fIn = progress01(frame, delay, delay + 20);
            const Icon = f.Icon;
            return (
              <div
                key={f.label}
                style={{
                  position: "absolute",
                  left: 60,
                  top: 100 + i * 130,
                  opacity: fIn,
                  transform: `translateY(${(1 - fIn) * 10}px)`,
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                }}
              >
                <Icon size={52} color={COLORS.muted} strokeWidth={1.6} />
                <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
                  {f.label}
                </div>
                <div style={{color: COLORS.red, fontSize: 24, fontWeight: 800}}>✕</div>
              </div>
            );
          })}

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 420,
              width: 940,
              height: 1,
              background: COLORS.border,
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 600,
              transform: `translate(-50%, -50%) translateY(${(1 - ciIn) * 10}px)`,
              opacity: ciIn,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <Terminal size={60} color={COLORS.cyan} strokeWidth={1.6} />
            <div style={{color: COLORS.white, fontFamily: FONTS.sans, fontSize: 22, fontWeight: 700}}>
              CI runs fmt, vet, test
            </div>
            <Checkmark progress={ciIn} size={44} />
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
