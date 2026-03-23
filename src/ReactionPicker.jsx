import React, { useEffect, useState } from "react";
import { supabase } from "./supabase.js";
import { useAuth } from "./AuthContext.jsx";

const REACTIONS = ["🔥", "😤", "💯", "🥶", "😭", "💀"];
const AUTO_DISMISS_MS = 2000;

export default function ReactionPicker({ trackId, username, onDismiss }) {
  const { currentUser } = useAuth();
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(1);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const frac = Math.max(0, 1 - elapsed / AUTO_DISMISS_MS);
      setTimeLeft(frac);
      if (frac === 0) {
        clearInterval(interval);
        onDismiss(null);
      }
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      onDismiss(null);
    }, AUTO_DISMISS_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onDismiss]);

  async function handleReact(emoji) {
    setSelected(emoji);

    if (currentUser && trackId) {
      try {
        await supabase.from('reactions').upsert({
          track_id: trackId,
          user_id: currentUser.id,
          emoji,
        }, { onConflict: 'track_id,user_id,emoji' });
      } catch (err) {
        console.error('Reaction save error:', err);
      }
    }

    setTimeout(() => onDismiss(emoji), 400);
  }

  return (
    <div className="reaction-picker-overlay">
      <div className="reaction-picker">
        <div className="reaction-picker__label">react quick!</div>
        <div className="reaction-picker__emojis">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className={`reaction-btn ${selected === emoji ? "reaction-btn--selected" : ""}`}
              onClick={() => handleReact(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        {/* Timer bar */}
        <div className="reaction-timer-bar">
          <div
            className="reaction-timer-fill"
            style={{ width: `${timeLeft * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// Helper: get all reactions for a track from Supabase (async)
export async function getTrackReactions(trackId) {
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji')
    .eq('track_id', trackId);

  if (error || !data) return {};

  const counts = {};
  data.forEach(r => {
    counts[r.emoji] = (counts[r.emoji] || 0) + 1;
  });
  return counts;
}
