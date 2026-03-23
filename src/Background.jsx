import { useEffect, useRef } from "react";

const COLORS = ["#ff2d78", "#ffe600", "#aaff00", "#ff6600", "#00cfff", "#bf5fff"];
const NOTES = [];
const TAGS = [];

export default function Background() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, raf;

    // --- Particles (floating music notes) ---
    let notes = [];
    // --- Drips ---
    let drips = [];
    // --- Graffiti tags ---
    let graffiti = [];
    // --- Pixel stars ---
    let stars = [];

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
      init();
    };

    const rand = (min, max) => Math.random() * (max - min) + min;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const init = () => {
      // Stars
      stars = Array.from({ length: 40 }, () => ({
        x: rand(0, W), y: rand(0, H),
        size: rand(2, 4),
        color: pick(COLORS),
        twinkle: rand(0, Math.PI * 2),
        speed: rand(0.02, 0.05),
      }));

      notes = [];

      // Drips along the top edge
      drips = [];

      graffiti = [];
    };

    const spawnNote = (anywhere = false) => ({
      x: rand(0, W),
      y: anywhere ? rand(0, H) : H + 20,
      char: pick(NOTES),
      color: pick(COLORS),
      size: rand(14, 24),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.4, -0.8),
      alpha: rand(0.2, 0.5),
      fade: rand(0.001, 0.002),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(0.02, 0.04),
    });

    const spawnDrip = (anywhere = false) => {
      const pixSize = pick([3, 4, 5]); // pixel block size
      const blocks = Math.floor(rand(6, 20)); // number of pixel blocks tall
      return {
        x: Math.floor(rand(0, W) / pixSize) * pixSize, // snap to pixel grid
        y: anywhere ? rand(-blocks * pixSize, 0) : rand(-blocks * pixSize, -pixSize),
        color: pick(COLORS),
        pixSize,
        blocks,
        speed: rand(0.3, 0.9),
        alpha: rand(0.35, 0.65),
      };
    };

    const spawnTag = (anywhere = false) => ({
      x: rand(30, W - 100),
      y: anywhere ? rand(30, H - 40) : rand(30, H - 40),
      text: pick(TAGS),
      color: pick(COLORS),
      size: rand(14, 28),
      alpha: rand(0.04, 0.09),
      rotation: rand(-0.25, 0.25),
    });

    let t = 0;

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      // Dark background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, W, H);

      // Subtle spray paint blobs (static, atmospheric)
      const blobs = [
        { x: 0.05, y: 0.1,  rx: 280, ry: 180, c: "rgba(255,45,120," },
        { x: 0.9,  y: 0.05, rx: 220, ry: 160, c: "rgba(255,230,0,"  },
        { x: 0.15, y: 0.85, rx: 200, ry: 240, c: "rgba(170,255,0,"  },
        { x: 0.8,  y: 0.65, rx: 300, ry: 130, c: "rgba(255,102,0,"  },
        { x: 0.5,  y: 0.5,  rx: 180, ry: 200, c: "rgba(0,207,255,"  },
        { x: 0.4,  y: 0.95, rx: 380, ry: 90,  c: "rgba(191,95,255," },
      ];
      blobs.forEach(b => {
        const pulse = 0.025 + 0.006 * Math.sin(t * 0.3 + b.x * 10);
        const g = ctx.createRadialGradient(b.x*W, b.y*H, 0, b.x*W, b.y*H, Math.max(b.rx, b.ry));
        g.addColorStop(0, b.c + pulse + ")");
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(b.x*W, b.y*H, b.rx, b.ry, 0.3, 0, Math.PI*2);
        ctx.fill();
      });

      // --- Stars (twinkling pixel dots) ---
      ctx.imageSmoothingEnabled = false;
      stars.forEach(s => {
        s.twinkle += s.speed;
        const a = 0.15 + 0.35 * Math.abs(Math.sin(s.twinkle));
        ctx.globalAlpha = a;
        ctx.fillStyle = s.color;
        // snap to pixel grid for crisp look
        const px = Math.floor(s.x / 2) * 2;
        const py = Math.floor(s.y / 2) * 2;
        const sz = Math.floor(s.size / 2) * 2;
        ctx.fillRect(px, py, sz, sz);
      });

      // --- Graffiti tags (faint background text) ---
      graffiti.forEach(g => {
        ctx.save();
        ctx.globalAlpha = g.alpha;
        ctx.translate(g.x, g.y);
        ctx.rotate(g.rotation);
        ctx.font = `900 italic ${g.size}px 'Arial Black', sans-serif`;
        ctx.fillStyle = g.color;
        ctx.fillText(g.text, 0, 0);
        ctx.restore();
      });

      // --- Pixel paint drips ---
      drips.forEach((d, i) => {
        d.y += d.speed;

        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.imageSmoothingEnabled = false;

        const p = d.pixSize;
        const startY = Math.floor(d.y / p) * p;

        // Draw pixel blocks stacked vertically (the drip body)
        for (let b = 0; b < d.blocks; b++) {
          // Vary width slightly per block for a rough pixel look
          const w = b === 0 ? p * 2 : b === d.blocks - 1 ? p : p * (b % 3 === 0 ? 2 : 1);
          ctx.fillRect(d.x, startY + b * p, w, p);
        }

        // Pixel blob at the bottom (2x2 or 3x3 block)
        const blobY = startY + d.blocks * p;
        ctx.fillRect(d.x - p, blobY,     p * 3, p);
        ctx.fillRect(d.x,     blobY + p, p,     p);

        if (d.y > H + d.blocks * p + p * 3) {
          drips[i] = spawnDrip(false);
        }
      });

      // --- Floating music notes ---
      notes.forEach((n, i) => {
        n.wobble += n.wobbleSpeed;
        n.x += n.vx + Math.sin(n.wobble) * 0.3;
        n.y += n.vy;
        n.alpha -= n.fade;

        ctx.globalAlpha = Math.max(0, n.alpha);
        ctx.font = `${n.size}px serif`;
        ctx.fillStyle = n.color;
        ctx.fillText(n.char, n.x, n.y);

        if (n.alpha <= 0 || n.y < -30) {
          notes[i] = spawnNote(false);
        }
      });

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: -1,
      }}
    />
  );
}
