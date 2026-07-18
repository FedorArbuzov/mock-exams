import React from "react";
import {COLORS} from "../constants";

export const Background: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      backgroundColor: COLORS.background,
      backgroundImage:
        "radial-gradient(ellipse at 50% 0%, rgba(50,108,229,0.22), transparent 55%), linear-gradient(rgba(72,86,117,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(72,86,117,0.12) 1px, transparent 1px)",
      backgroundSize: "auto, 40px 40px, 40px 40px",
    }}
  />
);
