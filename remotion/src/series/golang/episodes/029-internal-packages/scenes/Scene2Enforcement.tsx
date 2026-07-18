import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {Folder, FolderLock, Package} from "lucide-react";
import {COLORS, FONTS} from "../../../../../shared/constants";
import {Caption} from "../../../../../shared/components/Caption";
import {Checkmark} from "../../../../../shared/components/Checkmark";
import {Panel} from "../../../../../shared/components/Panel";
import {progress01} from "../../../../../shared/utils/animations";

type Props = {text: string; durationInFrames: number};

export const Scene2Enforcement: React.FC<Props> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const treeIn = progress01(frame, 0, 18);
  const insideIn = progress01(frame, 24, 42);
  const outsideIn = progress01(frame, 24, 42);
  const insideCheck = progress01(frame, 50, 68);
  const outsideCross = progress01(frame, 50, 68);

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
        <Panel width={900} height={800}>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 90,
              width: 620,
              height: 480,
              borderRadius: 20,
              border: `2px solid ${COLORS.white}`,
              opacity: treeIn,
              transform: `scale(${0.94 + treeIn * 0.06})`,
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
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              parent tree
            </div>

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 240,
                transform: `translate(-50%, -50%) scale(${0.9 + insideIn * 0.1})`,
                opacity: insideIn,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
              }}
            >
              <FolderLock size={82} color={COLORS.cyan} strokeWidth={1.6} />
              <div style={{color: COLORS.cyan, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700}}>
                internal
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 130,
                top: 400,
                transform: `translate(-50%, -50%) translateY(${(1 - insideIn) * 12}px)`,
                opacity: insideIn,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Folder size={54} color={COLORS.green} strokeWidth={1.6} />
              <Checkmark progress={insideCheck} size={34} />
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 780,
              top: 240,
              transform: `translate(-50%, -50%) translateY(${(1 - outsideIn) * 12}px)`,
              opacity: outsideIn,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div style={{position: "relative"}}>
              <Package size={70} color={COLORS.muted} strokeWidth={1.6} />
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: 70,
                  height: 3,
                  background: COLORS.red,
                  transform: "translate(-50%, -50%) rotate(45deg)",
                  opacity: outsideCross,
                }}
              />
            </div>
            <div style={{color: COLORS.muted, fontFamily: FONTS.sans, fontSize: 18, fontWeight: 650, textAlign: "center"}}>
              outside module
            </div>
          </div>
        </Panel>
      </div>

      <Caption text={text} durationInFrames={durationInFrames} />
    </AbsoluteFill>
  );
};
