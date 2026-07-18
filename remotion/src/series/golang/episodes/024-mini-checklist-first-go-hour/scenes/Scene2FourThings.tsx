import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {MessageSquareText, Play, Terminal} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const ICON_ITEMS = [
  {label: "version OK", Icon: Terminal},
  {label: "gopls diagnostics", Icon: MessageSquareText},
  {label: "hello runs", Icon: Play},
];

export const Scene2FourThings: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 800,
          transform: "translate(-50%, -50%)",
        }}
      >
        <Panel width={900} height={780}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 900,
              height: 780,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "1fr 1fr",
            }}
          >
            {ICON_ITEMS.map((it, i) => {
              const delay = 6 + i * 20;
              const cellIn = progress01(frame, delay, delay + 16);
              const Icon = it.Icon;
              return (
                <div
                  key={it.label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    opacity: cellIn,
                    transform: `scale(${0.9 + cellIn * 0.1})`,
                    borderRight: `1px solid ${COLORS.border}`,
                    borderBottom: `1px solid ${COLORS.border}`,
                  }}
                >
                  <Icon size={70} color={COLORS.cyan} strokeWidth={1.6} />
                  <div
                    style={{
                      color: COLORS.white,
                      fontFamily: FONTS.sans,
                      fontSize: 22,
                      fontWeight: 700,
                      textAlign: "center",
                      maxWidth: 260,
                    }}
                  >
                    {it.label}
                  </div>
                </div>
              );
            })}

            {(() => {
              const delay = 6 + 3 * 20;
              const cellIn = progress01(frame, delay, delay + 16);
              const checkIn = progress01(frame, delay + 14, delay + 30);
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 16,
                    opacity: cellIn,
                    transform: `scale(${0.9 + cellIn * 0.1})`,
                  }}
                >
                  <Checkmark progress={checkIn} size={72} />
                  <div
                    style={{
                      color: COLORS.white,
                      fontFamily: FONTS.sans,
                      fontSize: 22,
                      fontWeight: 700,
                      textAlign: "center",
                      maxWidth: 260,
                    }}
                  >
                    fmt + vet run once
                  </div>
                </div>
              );
            })()}
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
