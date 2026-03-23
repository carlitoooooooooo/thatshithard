import React, { useRef, useState, useEffect, useCallback } from "react";
import AudioPlayer from "./AudioPlayer.js";
import WaveformVisualizer from "./WaveformVisualizer.jsx";

const SWIPE_THRESHOLD = 80;

export default function SwipeCard({ track, onSwipe, isTop, stackIndex }) {
  const [dragX, setDragX] = useState(0);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isFlying, setIsFlying] = useState(false);
  const [flyDir, setFlyDir] = useState(null);
  const [stamp, setStamp] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const playerRef = useRef(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const pointerDownRef = useRef(false);
  const dragStartedRef = useRef(false);
  const cardRef = useRef(null);

  // Stop when no longer top card (don't auto-start — wait for user tap)
  useEffect(() => {
    if (track.isSoundCloud) return;
    if (!isTop) {
      stopPlay();
    }
    return () => {
      stopPlay();
    };
  }, [isTop, track.id]);

  function startPlay() {
    stopPlay();
    const p = new AudioPlayer(track.audioUrl, track.snippetStart);
    p.onTimeUpdate((prog) => setProgress(prog));
    p.onEnded(() => {
      setIsPlaying(false);
      setProgress(0);
    });
    playerRef.current = p;
    p.play();
    setIsPlaying(true);
    setProgress(0);
  }

  function stopPlay() {
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
  }

  function togglePlay() {
    if (!playerRef.current) {
      startPlay();
      return;
    }
    if (isPlaying) {
      playerRef.current.pause();
      setIsPlaying(false);
    } else {
      playerRef.current.play();
      setIsPlaying(true);
    }
  }

  const triggerSwipe = useCallback((dir) => {
    const label = dir === "right" ? "HARD 🔥" : "TRASH 💀";
    setStamp(label);
    setFlyDir(dir);
    setIsFlying(true);
    stopPlay();
    const rect = cardRef.current?.getBoundingClientRect();
    setTimeout(() => {
      onSwipe(dir, track, rect);
    }, 350);
  }, [track, onSwipe]);

  const onPointerDown = useCallback((e) => {
    if (isFlying) return;
    pointerDownRef.current = true;
    dragStartedRef.current = false;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [isFlying]);

  const onPointerMove = useCallback((e) => {
    if (!pointerDownRef.current || isFlying) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
      dragStartedRef.current = true;
    }
    if (dragStartedRef.current) {
      setIsDragging(true);
      setDragX(dx);
      setDragY(dy);
      if (dx > 30) setStamp("HARD 🔥");
      else if (dx < -30) setStamp("TRASH 💀");
      else setStamp(null);
    }
  }, [isFlying]);

  const onPointerUp = useCallback((e) => {
    if (!pointerDownRef.current) return;
    pointerDownRef.current = false;

    if (!dragStartedRef.current) {
      // Tap on card body (not on play button) — do nothing, let button handle it
      setDragX(0);
      setDragY(0);
      setIsDragging(false);
      setStamp(null);
      return;
    }

    const dx = e.clientX - startXRef.current;
    dragStartedRef.current = false;
    setIsDragging(false);

    if (dx > SWIPE_THRESHOLD) {
      triggerSwipe("right");
    } else if (dx < -SWIPE_THRESHOLD) {
      triggerSwipe("left");
    } else {
      setDragX(0);
      setDragY(0);
      setStamp(null);
    }
  }, [togglePlay, triggerSwipe]);

  const rotation = dragX * 0.08;
  const stampOpacity = Math.min(1, Math.abs(dragX) / SWIPE_THRESHOLD);

  let flyStyle = {};
  if (isFlying) {
    flyStyle = {
      transform: `translateX(${flyDir === "right" ? "120vw" : "-120vw"}) rotate(${flyDir === "right" ? 30 : -30}deg)`,
      transition: "transform 0.35s cubic-bezier(0.4, 0, 0.6, 1)",
    };
  } else if (isDragging) {
    flyStyle = {
      transform: `translateX(${dragX}px) translateY(${dragY * 0.3}px) rotate(${rotation}deg)`,
    };
  } else {
    flyStyle = {
      transform: `translateX(0) rotate(0deg) scale(${stackIndex === 0 ? 1 : 0.96 - stackIndex * 0.02})`,
      transition: isDragging ? "none" : "transform 0.25s ease",
    };
  }

  return (
    <div
      ref={cardRef}
      className={`swipe-card ${isTop ? "swipe-card--top" : ""}`}
      style={{
        position: "absolute",
        zIndex: 10 - stackIndex,
        cursor: isTop ? "grab" : "default",
        userSelect: "none",
        ...flyStyle,
      }}
      onPointerDown={isTop ? onPointerDown : undefined}
      onPointerMove={isTop ? onPointerMove : undefined}
      onPointerUp={isTop ? onPointerUp : undefined}
      onPointerCancel={isTop ? onPointerUp : undefined}
    >
      {/* Cover image */}
      <div
        className="swipe-card__cover"
        style={{ backgroundImage: `url(${track.coverUrl})` }}
      />

      {/* Gradient overlay */}
      <div className="swipe-card__overlay" />

      {/* Center: SC embed OR custom waveform */}
      {track.isSoundCloud ? (
        <div className="swipe-card__sc-embed" onClick={e => e.stopPropagation()}>
          <iframe
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={track.embedUrl}
            title="SoundCloud"
            style={{ width: "100%", height: "80px", border: "none" }}
          />
        </div>
      ) : (
        <div className="swipe-card__center">
          <WaveformVisualizer isPlaying={isPlaying} progress={progress} />
          <button
            className="swipe-card__play-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? "⏸" : "▶"}
          </button>
        </div>
      )}

      {/* Bottom info */}
      <div className="swipe-card__info">
        <div className="swipe-card__artist">{track.artist}</div>
        <div className="swipe-card__title">{track.title}</div>
        <div className="swipe-card__meta">
          <span className="genre-tag">{track.genre}</span>
          <span className="bpm-tag">{track.bpm} BPM</span>
        </div>
      </div>

      {/* Stamps */}
      {stamp && (
        <div
          className={`swipe-stamp swipe-stamp--${dragX > 0 || flyDir === "right" ? "hard" : "trash"}`}
          style={{ opacity: isFlying ? 1 : stampOpacity }}
        >
          {stamp}
        </div>
      )}

      {/* Progress bar */}
      <div className="swipe-card__progress-bar">
        <div className="swipe-card__progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

    </div>
  );
}
