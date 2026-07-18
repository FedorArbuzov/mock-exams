import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Package, TriangleAlert} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const IMPORTERS = ["service A", "service B", "service C"];

export const Scene4RenameWarning: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const pathIn = progress01(frame, 0, 20);
  const warnIn = progress01(frame, 20, 38);
  const brokenIn = progress01(frame, 46, 66);

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
        <Panel width={880} height={700}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 130,
              transform: "translate(-50%, -50%)",
              opacity: pathIn,
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "18px 32px",
              borderRadius: 16,
              border: `2px solid ${COLORS.red}`,
              background: "rgba(248,113,113,0.06)",
            }}
          >
            <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 28, fontWeight: 700}}>
              module path
            </div>
            <div style={{opacity: warnIn}}>
              <TriangleAlert size={40} color={COLORS.red} strokeWidth={1.8} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              top: 380,
              width: 880,
              display: "flex",
              justifyContent: "space-evenly",
            }}
          >
            {IMPORTERS.map((imp, i) => {
              const delay = 46 + i * 16;
              const impIn = progress01(frame, delay, delay + 16);
              return (
                <div
                  key={imp}
                  style={{
                    opacity: impIn,
                    transform: `translateY(${(1 - impIn) * 14}px)`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <div style={{position: "relative"}}>
                    <Package size={78} color={COLORS.muted} strokeWidth={1.6} />
                    <div
                      style={{
                        position: "absolute",
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: brokenIn,
                        width: 60,
                        height: 3,
                        background: COLORS.red,
                        transformOrigin: "center",
                        rotate: "45deg",
                      }}
                    />
                  </div>
                  <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650}}>
                    {imp}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 590,
              transform: "translate(-50%, -50%)",
              opacity: brokenIn,
              color: COLORS.red,
              fontFamily: FONTS.sans,
              fontSize: 24,
              fontWeight: 750,
              textAlign: "center",
              width: 700,
            }}
          >
            broken for everyone downstream
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
