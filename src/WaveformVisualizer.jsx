import React, { useEffect, useRef, useState } from "react";

const BAR_COUNT = 40;
const MIN_HEIGHT = 4;
const MAX_HEIGHT = 48;

// Pre-generate a static waveform pattern per bar
const BASE_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const base =
    Math.abs(Math.sin(i * 0.45)) * 0.6 +
    Math.abs(Math.sin(i * 0.9 + 1.2)) * 0.25 +
    Math.abs(Math.sin(i * 0.2 + 2.5)) * 0.15;
  return Math.max(0.1, Math.min(1, base));
});

// Bars 5, 15, 25, 35 are yellow accent bars
const YELLOW_BARS = new Set([5, 15, 25, 35]);

export default function WaveformVisualizer({ isPlaying, progress = 0 }) {
  const animFrameRef = useRef(null);
  const timeRef = useRef(0);
  const [heights, setHeights] = useState(BASE_HEIGHTS.map((h) => h * 0.3));

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      // Freeze at current position
      return;
    }

    const animate = (ts) => {
      timeRef.current = ts / 1000;
      const t = timeRef.current;

      const newHeights = BASE_HEIGHTS.map((base, i) => {
        const wave =
          base +
          Math.sin(t * 3.5 + i * 0.4) * 0.15 +
          Math.sin(t * 7.1 + i * 0.8) * 0.08 +
          Math.sin(t * 1.8 + i * 0.2) * 0.07;
        return Math.max(0.08, Math.min(1, wave));
      });

      setHeights(newHeights);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying]);

  const barWidth = 4;
  const gap = 2;
  const totalWidth = BAR_COUNT * (barWidth + gap) - gap;

  return (
    <div
      className="waveform-visualizer"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "60px",
      }}
    >
      <svg
        width={totalWidth}
        height={MAX_HEIGHT + 4}
        style={{ display: "block", imageRendering: "pixelated" }}
        aria-label="Audio waveform"
      >
        {heights.map((h, i) => {
          const barH = Math.max(MIN_HEIGHT, Math.round(h * MAX_HEIGHT));
          const x = i * (barWidth + gap);
          const y = (MAX_HEIGHT - barH) / 2 + 2;
          const played = progress > 0 && i / BAR_COUNT < progress;
          const color = YELLOW_BARS.has(i)
            ? "#ffe600"
            : played
            ? "#ff2d78"
            : isPlaying
            ? "#ff2d78"
            : "#882244";
          const opacity = played || isPlaying ? 1 : 0.4;

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              fill={color}
              opacity={opacity}
              style={{ transition: isPlaying ? "none" : "height 0.1s" }}
            />
          );
        })}
      </svg>
    </div>
  );
}
