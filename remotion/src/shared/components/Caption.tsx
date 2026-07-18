import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {COLORS, FONTS, SPACING} from "../constants";
import {useHighlightWords} from "../HighlightWords";
import {clamp, pulse} from "../utils/animations";

type CaptionProps = {
  text: string;
  durationInFrames: number;
};

const isHighlight = (word: string, highlightWords: readonly string[]) => {
  const cleaned = word.replace(/[^\w\s]/g, "");
  return highlightWords.some(
    (h) => cleaned.toLowerCase() === h.toLowerCase() || cleaned.toLowerCase().includes(h.toLowerCase()),
  );
};

export const Caption: React.FC<CaptionProps> = ({text, durationInFrames}) => {
  const frame = useCurrentFrame();
  const highlightWords = useHighlightWords();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const appearWindow = Math.max(12, Math.floor(durationInFrames * 0.55));

  return (
    <div
      style={{
        position: "absolute",
        left: SPACING.screenPadX,
        right: SPACING.screenPadX,
        bottom: 118,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px 12px",
        fontFamily: FONTS.sans,
        fontSize: 46,
        lineHeight: 1.25,
        fontWeight: 650,
        textAlign: "center",
        maxHeight: 280,
        overflow: "hidden",
      }}
    >
      {words.map((word, index) => {
        const start = Math.floor((index / Math.max(1, words.length)) * appearWindow);
        const opacity = interpolate(frame, [start, start + 8], [0, 1], clamp);
        const y = interpolate(frame, [start, start + 8], [10, 0], clamp);
        const highlight = isHighlight(word, highlightWords);
        const scale = highlight ? pulse(frame + index * 3, 0.1, 1, 1.04) : 1;

        return (
          <span
            key={`${word}-${index}`}
            style={{
              opacity,
              transform: `translateY(${y}px) scale(${scale})`,
              color: highlight ? COLORS.cyan : COLORS.white,
              textShadow: highlight ? `0 0 16px ${COLORS.glowCyan}` : "0 2px 10px rgba(0,0,0,0.45)",
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
