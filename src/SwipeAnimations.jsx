import { useEffect, useState } from "react";
import "./SwipeAnimations.css";

// Fire burst — shown on right swipe (HARD)
export function FireAnimation({ origin, onDone }) {
  // origin: { x, y } — center of where the card was
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: origin.x + (Math.random() - 0.5) * 120,
    y: origin.y + (Math.random() - 0.5) * 80,
    size: 12 + Math.random() * 28,
    color: ["#ff6600", "#ff2d78", "#ffe600", "#ff9900", "#ff3300"][Math.floor(Math.random() * 5)],
    duration: 0.4 + Math.random() * 0.4,
    delay: Math.random() * 0.15,
  }));

  const rings = Array.from({ length: 3 }, (_, i) => ({
    id: i,
    x: origin.x + (Math.random() - 0.5) * 60,
    y: origin.y + (Math.random() - 0.5) * 60,
    size: 20 + i * 15,
  }));

  useEffect(() => {
    const t = setTimeout(onDone, 700);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fire-container">
      {/* Rings */}
      {rings.map(r => (
        <div
          key={r.id}
          className="fire-ring"
          style={{
            left: r.x - r.size / 2,
            top:  r.y - r.size / 2,
            width: r.size,
            height: r.size,
            animationDelay: `${r.id * 0.08}s`,
            animationDuration: "0.5s",
          }}
        />
      ))}
      {/* Flame particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="fire-particle"
          style={{
            left: p.x,
            top:  p.y,
            width:  p.size,
            height: p.size * 1.4,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay:    `${p.delay}s`,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

// Trash can pop — shown on left swipe (TRASH)
export function TrashAnimation({ onDone }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 600);
    const t2 = setTimeout(onDone, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`trash-container ${fading ? "trash-fadeout" : ""}`}>
      <div style={{ position: "relative", display: "inline-block" }}>
        <span className="trash-lid">🪣</span>
        <span className="trash-can">🗑️</span>
      </div>
      <div className="trash-label">TRASHED</div>
    </div>
  );
}
