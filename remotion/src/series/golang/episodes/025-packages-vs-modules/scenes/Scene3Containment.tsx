import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Arrow} from "../../../../../shared/components/Arrow";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

const PACKAGES = ["auth", "db", "api"];

export const Scene3Containment: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const outerIn = progress01(frame, 0, 18);
  const arrowIn = progress01(frame, 60, 78);

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
        <Panel width={860} height={760}>
          <div
            style={{
              position: "absolute",
              left: 60,
              top: 90,
              width: 620,
              height: 560,
              borderRadius: 20,
              border: `2px solid ${COLORS.white}`,
              opacity: outerIn,
              transform: `scale(${0.94 + outerIn * 0.06})`,
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 20,
                top: -18,
                background: COLORS.background,
                padding: "0 10px",
                color: COLORS.white,
                fontFamily: FONTS.mono,
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              module
            </div>

            {PACKAGES.map((pkg, i) => {
              const delay = 24 + i * 16;
              const pkgIn = progress01(frame, delay, delay + 16);
              return (
                <div
                  key={pkg}
                  style={{
                    position: "absolute",
                    left: 130 + i * 190,
                    top: 280,
                    transform: `translate(-50%, -50%) scale(${0.9 + pkgIn * 0.1})`,
                    opacity: pkgIn,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Folder
                    size={78}
                    color={i === 1 ? COLORS.cyan : COLORS.green}
                    strokeWidth={1.6}
                  />
                  <div style={{color: COLORS.white, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 650}}>
                    {pkg}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              position: "absolute",
              left: 370,
              top: 700,
              transform: "translate(-50%, -50%)",
              opacity: arrowIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Arrow direction="up" size={44} color={COLORS.cyan} />
            <div style={{color: COLORS.cyan, fontFamily: FONTS.sans, fontSize: 20, fontWeight: 700}}>
              import path
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
