import React, { useState, useEffect, useMemo } from "react";
import { useAuth, AVATAR_COLORS } from "./AuthContext.jsx";
import { BADGES } from "./badges.js";
import { MOCK_USERS } from "./mockUsers.js";
import SnippetPicker from "./SnippetPicker.jsx";
import { supabase } from "./supabase.js";

const REACTIONS_EMOJIS = ["🔥", "😤", "💯", "🥶", "😭", "💀"];

function getTopReaction(counts) {
  let top = null;
  let max = 0;
  for (const [emoji, count] of Object.entries(counts)) {
    if (count > max) { max = count; top = emoji; }
  }
  return top;
}

// Pinned track storage (localStorage is fine for UI prefs)
function getPinnedTrack(username) {
  try { return JSON.parse(localStorage.getItem(`ds_pinned_${username}`)); } catch { return null; }
}
function setPinnedTrack(username, trackId) {
  localStorage.setItem(`ds_pinned_${username}`, JSON.stringify(trackId));
}

export default function ProfilePage({ userVotes, tracks }) {
  const { currentUser, setUserData, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(currentUser?.bio || "");
  const [editColor, setEditColor] = useState(currentUser?.avatarColor || AVATAR_COLORS[0]);
  const [showSnippetPicker, setShowSnippetPicker] = useState(false);
  const [snippetConfirmed, setSnippetConfirmed] = useState(null);
  const [pinnedId, setPinnedId] = useState(() => getPinnedTrack(currentUser?.username));

  // Supabase-loaded uploads
  const [myUploads, setMyUploads] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(true);

  // Reaction counts per upload track
  const [uploadReactions, setUploadReactions] = useState({});

  useEffect(() => {
    if (!currentUser?.id) return;

    setUploadsLoading(true);
    supabase
      .from('tracks')
      .select('*')
      .eq('uploaded_by_username', currentUser.username)
      .order('listed_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) {
          const mapped = data.map(t => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            genre: t.genre,
            coverUrl: t.cover_url || "",
            hards: t.hards || 0,
            trash: t.trash || 0,
            listedAt: t.listed_at,
          }));
          setMyUploads(mapped);

          // Load reactions for each upload
          mapped.forEach(async (track) => {
            const { data: rxData } = await supabase
              .from('reactions')
              .select('emoji')
              .eq('track_id', track.id);

            if (rxData) {
              const counts = {};
              rxData.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
              setUploadReactions(prev => ({ ...prev, [track.id]: counts }));
            }
          });
        }
        setUploadsLoading(false);
      });
  }, [currentUser?.id]);

  if (!currentUser) return null;

  // Compute stats from votes (passed from App.jsx / Supabase)
  const voteEntries = Object.entries(userVotes || {});
  const seen = voteEntries.length;
  const hards = voteEntries.filter(([, v]) => v === "right").length;
  const trashCount = voteEntries.filter(([, v]) => v === "left").length;
  const hardPct = seen > 0 ? Math.round((hards / seen) * 100) : 0;
  const tasteScore = hards * 10 + seen * 1;

  // Hard'd genres
  const hardedTrackIds = voteEntries.filter(([, v]) => v === "right").map(([id]) => String(id));
  const hardedTracks = (tracks || []).filter(t => hardedTrackIds.includes(String(t.id)));
  const hardedGenres = [...new Set(hardedTracks.map(t => t.genre))];

  // Badge stats
  const badgeStats = {
    totalHards: hards,
    totalTrash: trashCount,
    totalRated: seen,
    uniqueGenres: hardedGenres.length,
  };

  // Taste Match against mock users
  function calcMatch(otherVotes) {
    const otherHardIds = Object.entries(otherVotes)
      .filter(([, v]) => v === "right")
      .map(([id]) => String(id));
    const otherHardTracks = (tracks || []).filter(t => otherHardIds.includes(String(t.id)));
    const otherGenres = new Set(otherHardTracks.map(t => t.genre));
    const myGenres = new Set(hardedGenres);
    const shared = [...myGenres].filter(g => otherGenres.has(g));
    const total = new Set([...myGenres, ...otherGenres]).size;
    const pct = total > 0 ? Math.round((shared.length / total) * 100) : 0;
    return { pct, shared };
  }

  const tasteMatches = MOCK_USERS.map(u => ({
    ...u,
    ...calcMatch(u.votes),
  })).sort((a, b) => b.pct - a.pct).slice(0, 3);

  function saveEdit() {
    setUserData("bio", editBio);
    setUserData("avatarColor", editColor);
    setEditing(false);
  }

  function handlePin(trackId) {
    const newId = pinnedId === trackId ? null : trackId;
    setPinnedId(newId);
    setPinnedTrack(currentUser.username, newId);
  }

  function handleSnippetConfirm(result) {
    setSnippetConfirmed(result);
    setShowSnippetPicker(false);
  }

  const pinnedTrack = pinnedId
    ? (tracks || []).find(t => t.id === pinnedId) || myUploads.find(t => t.id === pinnedId)
    : null;

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-header">
        <div
          className="profile-avatar"
          style={{ background: currentUser.avatarColor }}
        >
          {currentUser.username[0].toUpperCase()}
        </div>
        <div className="profile-info">
          <div className="profile-username">{currentUser.username}</div>
          {!editing && (
            <div className="profile-bio">{currentUser.bio || "no bio yet..."}</div>
          )}
          {editing && (
            <div className="profile-edit-form">
              <input
                className="auth-input"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="your bio..."
                maxLength={80}
              />
              <div className="avatar-color-picker" style={{ marginTop: "8px" }}>
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`avatar-color-option ${editColor === color ? "avatar-color-option--selected" : ""}`}
                    style={{ background: color }}
                    onClick={() => setEditColor(color)}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button className="btn-bevel btn-pink" onClick={saveEdit} style={{ fontSize: "10px", padding: "6px 12px" }}>
                  SAVE
                </button>
                <button className="btn-bevel" onClick={() => setEditing(false)} style={{ fontSize: "10px", padding: "6px 12px" }}>
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
        {!editing && (
          <button className="profile-edit-btn btn-bevel" onClick={() => setEditing(true)}>
            ✏️
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-box">
          <div className="stat-value">{seen}</div>
          <div className="stat-label">rated</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: "var(--pink)" }}>{hardPct}%</div>
          <div className="stat-label">hard %</div>
        </div>
        <div className="stat-box">
          <div className="stat-value" style={{ color: "var(--yellow)" }}>{tasteScore}</div>
          <div className="stat-label">taste score</div>
        </div>
      </div>

      {/* Pinned Track */}
      {pinnedTrack && (
        <div className="profile-section">
          <div className="section-title">📌 PINNED TRACK</div>
          <div className="pinned-track-card">
            <div
              className="pinned-track-thumb"
              style={{ backgroundImage: `url(${pinnedTrack.coverUrl})` }}
            />
            <div className="pinned-track-info">
              <div className="pinned-track-title">{pinnedTrack.title}</div>
              <div className="pinned-track-artist">{pinnedTrack.artist}</div>
              <span className="genre-tag" style={{ fontSize: "7px", padding: "2px 6px" }}>{pinnedTrack.genre}</span>
            </div>
            <div className="pinned-indicator">📌</div>
          </div>
        </div>
      )}

      {/* Taste tags */}
      {hards > 0 && (
        <div className="profile-section">
          <div className="section-title">🎯 YOUR TASTE</div>
          <div className="taste-tags">
            {hards > 0 && <span className="taste-tag">🔥 Trendsetter</span>}
            {hardPct > 70 && <span className="taste-tag">💎 Picky AF</span>}
            {hardPct < 30 && <span className="taste-tag">💀 Hard to Please</span>}
            {seen > 10 && <span className="taste-tag">👀 Deep Diver</span>}
            {tasteScore > 100 && <span className="taste-tag">⚡ Taste God</span>}
            {hardedGenres.map((g) => (
              <span key={g} className="taste-tag" style={{ borderColor: "var(--blue)", color: "var(--blue)" }}>{g}</span>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      <div className="profile-section">
        <div className="section-title">BADGES</div>
        <div className="badges-grid">
          {BADGES.map((badge) => {
            const earned = badge.check(badgeStats);
            return (
              <div
                key={badge.id}
                className={`badge-chip ${earned ? "badge-chip--earned" : "badge-chip--locked"}`}
                title={badge.desc}
              >
                <span className="badge-emoji">{earned ? badge.emoji : "🔒"}</span>
                <span className="badge-label">{badge.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Taste Match */}
      <div className="profile-section">
        <div className="section-title">💞 TASTE MATCH</div>
        {hardedGenres.length === 0 ? (
          <div className="taste-match-empty">Hard some tracks to see your matches!</div>
        ) : (
          <div className="taste-match-list">
            {tasteMatches.map((u) => (
              <div key={u.username} className="taste-match-card">
                <div
                  className="taste-match-avatar"
                  style={{ background: u.avatarColor }}
                >
                  {u.username[0].toUpperCase()}
                </div>
                <div className="taste-match-info">
                  <div className="taste-match-username">@{u.username}</div>
                  <div className="taste-match-bar-wrap">
                    <div className="taste-match-bar">
                      <div
                        className="taste-match-fill"
                        style={{ width: `${u.pct}%` }}
                      />
                    </div>
                    <span className="taste-match-pct">{u.pct}%</span>
                  </div>
                  {u.shared.length > 0 && (
                    <div className="taste-match-genres">
                      {u.shared.map((g) => (
                        <span key={g} className="taste-match-genre-tag">{g}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Uploads */}
      <div className="profile-section">
        <div className="section-title">📤 MY UPLOADS</div>

        {uploadsLoading ? (
          <div style={{ color: "var(--pink)", fontSize: "12px", padding: "8px 0" }}>loading uploads...</div>
        ) : myUploads.length === 0 ? (
          <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>no uploads yet. drop something!</div>
        ) : (
          <div className="uploads-list">
            {myUploads.map((track) => {
              const total = (track.hards || 0) + (track.trash || 0);
              const hp = total > 0 ? Math.round((track.hards / total) * 100) : 0;
              const reactions = uploadReactions[track.id] || {};
              const topRx = getTopReaction(reactions);
              const isPinned = pinnedId === track.id;

              return (
                <div key={track.id} className="upload-track-card">
                  <div className="upload-track-header">
                    <div
                      className="upload-track-thumb"
                      style={{ backgroundImage: `url(${track.coverUrl})` }}
                    />
                    <div className="upload-track-meta">
                      <div className="upload-track-title">{track.title}</div>
                      <div className="upload-track-genre">
                        <span className="genre-tag" style={{ fontSize: "7px", padding: "2px 5px" }}>{track.genre}</span>
                      </div>
                    </div>
                    <button
                      className={`btn-bevel pin-btn ${isPinned ? "pin-btn--active" : ""}`}
                      onClick={() => handlePin(track.id)}
                      title={isPinned ? "Unpin" : "Pin this track"}
                    >
                      {isPinned ? "📌" : "PIN"}
                    </button>
                  </div>

                  {/* Analytics */}
                  <div className="upload-analytics">
                    <div className="analytics-row">
                      <div className="analytics-item">
                        <span className="analytics-label">ratings</span>
                        <span className="analytics-value">{total}</span>
                      </div>
                      <div className="analytics-item">
                        <span className="analytics-label">hard %</span>
                        <span className="analytics-value" style={{ color: "var(--green)" }}>{hp}%</span>
                      </div>
                      {topRx && (
                        <div className="analytics-item">
                          <span className="analytics-label">top react</span>
                          <span className="analytics-value">{topRx}</span>
                        </div>
                      )}
                    </div>
                    <div className="analytics-ratio-bar">
                      <div
                        className="analytics-ratio-fill"
                        style={{ width: total > 0 ? `${hp}%` : "50%" }}
                      />
                    </div>
                    <div className="analytics-ratio-labels">
                      <span style={{ color: "var(--green)" }}>🔥 {track.hards || 0}</span>
                      <span style={{ color: "#ff4444" }}>💀 {track.trash || 0}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button
          className="btn-bevel btn-yellow"
          style={{ marginTop: "12px", fontSize: "10px", padding: "8px 16px", display: "block", width: "100%" }}
          onClick={() => setShowSnippetPicker(true)}
        >
          + UPLOAD TRACK
        </button>

        {snippetConfirmed && (
          <div className="snippet-confirmed">
            ✓ Snippet set: {Math.floor(snippetConfirmed.startSec / 60)}:{String(Math.floor(snippetConfirmed.startSec % 60)).padStart(2,"0")} → {Math.floor(snippetConfirmed.endSec / 60)}:{String(Math.floor(snippetConfirmed.endSec % 60)).padStart(2,"0")}
          </div>
        )}
      </div>

      {/* Logout */}
      <div style={{ padding: "16px", textAlign: "center" }}>
        <button className="btn-bevel btn-trash" onClick={logout} style={{ fontSize: "10px", padding: "8px 16px" }}>
          LOGOUT
        </button>
      </div>

      {showSnippetPicker && (
        <SnippetPicker
          onClose={() => setShowSnippetPicker(false)}
          onConfirm={handleSnippetConfirm}
        />
      )}
    </div>
  );
}
