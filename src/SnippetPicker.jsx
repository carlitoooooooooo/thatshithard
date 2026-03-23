import React, { useState, useRef, useCallback } from "react";

const BAR_COUNT = 40;
const TOTAL_DURATION = 120; // seconds (fake total track duration)
const SNIPPET_DURATION = 15; // seconds

// Pre-generate waveform heights
const BAR_HEIGHTS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const h =
    Math.abs(Math.sin(i * 0.45)) * 0.6 +
    Math.abs(Math.sin(i * 0.9 + 1.2)) * 0.25 +
    Math.abs(Math.sin(i * 0.2 + 2.5)) * 0.15;
  return Math.max(0.1, Math.min(1, h));
});

const BAR_W = 6;
const BAR_GAP = 2;
const SVG_H = 60;
const MAX_H = 48;
const MIN_H = 4;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function SnippetPicker({ onClose, onConfirm }) {
  // windowStart is a fraction 0..1 of where the 15s window starts
  const maxStart = TOTAL_DURATION - SNIPPET_DURATION;
  const [startSec, setStartSec] = useState(0);
  const isDragging = useRef(false);
  const svgRef = useRef(null);

  const totalSvgW = BAR_COUNT * (BAR_W + BAR_GAP) - BAR_GAP;

  // Convert startSec to bar fraction
  const snippetFrac = SNIPPET_DURATION / TOTAL_DURATION;
  const startFrac = startSec / TOTAL_DURATION;
  const endFrac = (startSec + SNIPPET_DURATION) / TOTAL_DURATION;

  const startBarF = startFrac * BAR_COUNT;
  const endBarF = endFrac * BAR_COUNT;

  function fracFromClientX(clientX) {
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const frac = x / rect.width;
    return Math.max(0, Math.min(1 - snippetFrac, frac));
  }

  const handlePointerDown = useCallback((e) => {
    isDragging.current = true;
    svgRef.current.setPointerCapture(e.pointerId);
    const frac = fracFromClientX(e.clientX);
    setStartSec(Math.round(frac * TOTAL_DURATION));
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const frac = fracFromClientX(e.clientX);
    setStartSec(Math.round(frac * TOTAL_DURATION));
  }, []);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const endSec = startSec + SNIPPET_DURATION;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="snippet-picker-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="snippet-picker__header">
          <div className="snippet-picker__title">PICK YOUR SNIPPET</div>
          <div className="snippet-picker__sub">drag to select 15-second preview</div>
        </div>

        <div className="snippet-picker__waveform-wrap">
          <svg
            ref={svgRef}
            width="100%"
            viewBox={`0 0 ${totalSvgW} ${SVG_H}`}
            preserveAspectRatio="none"
            style={{ display: "block", cursor: "ew-resize", touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Selection highlight background */}
            <rect
              x={startBarF * (BAR_W + BAR_GAP)}
              y={0}
              width={(endBarF - startBarF) * (BAR_W + BAR_GAP)}
              height={SVG_H}
              fill="rgba(255,45,120,0.12)"
            />

            {/* Bars */}
            {BAR_HEIGHTS.map((h, i) => {
              const barH = Math.max(MIN_H, Math.round(h * MAX_H));
              const x = i * (BAR_W + BAR_GAP);
              const y = (MAX_H - barH) / 2 + 2;
              const inRegion = i >= startBarF && i < endBarF;
              const color = inRegion ? "#ff2d78" : "#882244";
              const opacity = inRegion ? 1 : 0.35;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={BAR_W}
                  height={barH}
                  fill={color}
                  opacity={opacity}
                />
              );
            })}

            {/* Selection bracket lines */}
            <line
              x1={startBarF * (BAR_W + BAR_GAP)}
              y1={0}
              x2={startBarF * (BAR_W + BAR_GAP)}
              y2={SVG_H}
              stroke="#ff2d78"
              strokeWidth="2"
            />
            <line
              x1={endBarF * (BAR_W + BAR_GAP)}
              y1={0}
              x2={endBarF * (BAR_W + BAR_GAP)}
              y2={SVG_H}
              stroke="#ff2d78"
              strokeWidth="2"
            />
          </svg>
        </div>

        <div className="snippet-picker__time-display">
          <span className="snippet-time">{formatTime(startSec)}</span>
          <span className="snippet-duration">— 15 sec —</span>
          <span className="snippet-time">{formatTime(endSec)}</span>
        </div>

        <div className="snippet-picker__hint">← drag waveform to move window →</div>

        <div className="snippet-picker__actions">
          <button className="btn-bevel" onClick={onClose} style={{ fontSize: "9px", padding: "10px 16px" }}>
            CANCEL
          </button>
          <button
            className="btn-bevel btn-pink"
            onClick={() => onConfirm && onConfirm({ startSec, endSec })}
            style={{ fontSize: "9px", padding: "10px 16px" }}
          >
            ✓ CONFIRM SNIPPET
          </button>
        </div>
      </div>
    </div>
  );
}
