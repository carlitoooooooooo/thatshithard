import React, { useState, useRef, useEffect } from "react";
import AudioPlayer from "./AudioPlayer.js";
import WaveformVisualizer from "./WaveformVisualizer.jsx";
import { useAuth } from "./AuthContext.jsx";
import { supabase } from "./supabase.js";

const REACTIONS_EMOJIS = ["🔥", "😤", "💯", "🥶", "😭", "💀"];

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TrackModal({ track, onClose, onVote, userVotes }) {
  const { currentUser } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const playerRef = useRef(null);
  const [reactionCounts, setReactionCounts] = useState({});
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const commentsEndRef = useRef(null);
  const channelRef = useRef(null);

  // Load comments from Supabase
  useEffect(() => {
    setCommentsLoading(true);
    supabase
      .from('comments')
      .select('*')
      .eq('track_id', track.id)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setComments(data);
        setCommentsLoading(false);
      });

    // Real-time comment subscription
    channelRef.current = supabase
      .channel(`comments:${track.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `track_id=eq.${track.id}`,
      }, (payload) => {
        setComments(prev => {
          const exists = prev.some(c => c.id === payload.new.id);
          if (exists) return prev;
          return [...prev, payload.new];
        });
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [track.id]);

  // Load reaction counts from Supabase
  useEffect(() => {
    supabase
      .from('reactions')
      .select('emoji')
      .eq('track_id', track.id)
      .then(({ data, error }) => {
        if (!error && data) {
          const counts = {};
          data.forEach(r => {
            counts[r.emoji] = (counts[r.emoji] || 0) + 1;
          });
          setReactionCounts(counts);
        }
      });
  }, [track.id]);

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || !currentUser || commentSubmitting) return;

    setCommentSubmitting(true);
    const { data, error } = await supabase.from('comments').insert({
      track_id: track.id,
      user_id: currentUser.id,
      username: currentUser.username,
      avatar_color: currentUser.avatarColor || "#ff2d78",
      text,
    }).select().single();

    if (!error && data) {
      // Optimistic add (real-time will dedupe)
      setComments(prev => {
        const exists = prev.some(c => c.id === data.id);
        if (exists) return prev;
        return [...prev, data];
      });
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
    setCommentText("");
    setCommentSubmitting(false);
  };

  function togglePlay() {
    if (!playerRef.current) {
      const p = new AudioPlayer(track.audioUrl, track.snippetStart);
      p.onTimeUpdate((prog) => setProgress(prog));
      p.onEnded(() => { setIsPlaying(false); setProgress(0); });
      playerRef.current = p;
      p.play();
      setIsPlaying(true);
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

  const total = track.hards + track.trash;
  const hardPct = total > 0 ? Math.round((track.hards / total) * 100) : 50;
  const userVote = userVotes?.[track.id];

  function handleVote(dir) {
    if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; }
    setIsPlaying(false);
    onVote(dir, track);
    onClose();
  }

  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="track-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        <div
          className="track-modal__cover"
          style={{ backgroundImage: `url(${track.coverUrl})` }}
        />

        <div className="track-modal__body">
          <div className="track-modal__genre-tag">{track.genre}</div>
          <div className="track-modal__title">{track.title}</div>
          <div className="track-modal__artist">{track.artist}</div>

          <div className="track-modal__meta">
            <span>{track.bpm} BPM</span>
            <span>by @{track.uploadedBy}</span>
          </div>

          <div className="track-modal__tags">
            {(track.tags || []).map((tag) => (
              <span key={tag} className="track-tag">#{tag}</span>
            ))}
          </div>

          {/* Waveform + play */}
          <div className="track-modal__player">
            <WaveformVisualizer isPlaying={isPlaying} progress={progress} />
            <button className="swipe-card__play-btn" onClick={togglePlay}>
              {isPlaying ? "⏸" : "▶"}
            </button>
          </div>

          {/* Reaction counts */}
          {hasReactions && (
            <div className="modal-reactions">
              {REACTIONS_EMOJIS.map((emoji) => {
                const count = reactionCounts[emoji];
                if (!count) return null;
                return (
                  <span key={emoji} className="reaction-badge">
                    {emoji} <span className="reaction-badge-count">{count}</span>
                  </span>
                );
              })}
            </div>
          )}

          {/* Ratio bar */}
          <div className="track-modal__ratio">
            <div className="ratio-label">
              <span className="ratio-hard">🔥 {track.hards}</span>
              <span className="ratio-trash">💀 {track.trash}</span>
            </div>
            <div className="ratio-bar">
              <div className="ratio-bar__fill" style={{ width: `${hardPct}%` }} />
            </div>
          </div>

          {/* Vote buttons */}
          {!userVote ? (
            <div className="track-modal__votes">
              <button
                className="btn-bevel btn-vote btn-trash"
                onClick={() => handleVote("left")}
              >
                💀 TRASH IT
              </button>
              <button
                className="btn-bevel btn-vote btn-hard"
                onClick={() => handleVote("right")}
              >
                🔥 HARD IT
              </button>
            </div>
          ) : (
            <div className="track-modal__voted">
              {userVote === "right" ? "🔥 You said HARD" : "💀 You said TRASH"}
            </div>
          )}

          {/* Comments */}
          <div className="comments-section">
            <div className="comments-header">
              💬 <span>COMMENTS</span>
              <span className="comments-count">{comments.length}</span>
            </div>

            <div className="comments-list">
              {commentsLoading ? (
                <div className="comments-empty">loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="comments-empty">no comments yet. say something.</div>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="comment">
                    <div
                      className="comment-avatar"
                      style={{ background: c.avatar_color || c.avatarColor }}
                    >
                      {(c.username || "?")[0].toUpperCase()}
                    </div>
                    <div className="comment-body">
                      <div className="comment-meta">
                        <span className="comment-username">@{c.username}</span>
                        <span className="comment-time">{timeAgo(c.created_at || c.createdAt)}</span>
                      </div>
                      <div className="comment-text">{c.text}</div>
                    </div>
                  </div>
                ))
              )}
              <div ref={commentsEndRef} />
            </div>

            <div className="comment-input-row">
              <input
                className="comment-input"
                type="text"
                placeholder="drop a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitComment()}
                maxLength={200}
                disabled={commentSubmitting}
              />
              <button
                className="btn-bevel btn-pink comment-submit"
                onClick={submitComment}
                disabled={!commentText.trim() || commentSubmitting}
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
