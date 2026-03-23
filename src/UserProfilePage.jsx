import React, { useState, useEffect } from "react";
import TrackModal from "./TrackModal.jsx";
import { dbSelect } from "./dbHelper.js";

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function mapTrack(t) {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    genre: t.genre,
    bpm: t.bpm || 0,
    coverUrl: t.cover_url || "",
    audioUrl: t.audio_url || "",
    snippetStart: t.snippet_start || 0,
    tags: t.tags || [],
    uploadedBy: t.uploaded_by_username || t.uploaded_by || "unknown",
    uploadedById: t.uploaded_by || null,
    listedAt: t.listed_at || new Date().toISOString(),
    hards: t.hards || 0,
    trash: t.trash || 0,
    soundcloudUrl: t.soundcloud_url || null,
    embedUrl: t.embed_url || null,
    isSoundCloud: !!(t.soundcloud_url),
  };
}

export default function UserProfilePage({ username, onClose, onOpenModal, userVotes }) {
  const [profile, setProfile] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Load profile
        const profileData = await dbSelect('profiles', { username });
        const prof = Array.isArray(profileData) ? profileData[0] : profileData;
        setProfile(prof || null);

        // Load their tracks
        const tracksData = await dbSelect('tracks', { uploaded_by_username: username });
        const mapped = Array.isArray(tracksData) ? tracksData.map(mapTrack) : [];
        // Sort by listed_at descending
        mapped.sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt));
        setTracks(mapped);
      } catch (err) {
        console.error('UserProfilePage load error:', err);
      } finally {
        setLoading(false);
      }
    }
    if (username) load();
  }, [username]);

  const totalHards = tracks.reduce((s, t) => s + (t.hards || 0), 0);
  const totalTrash = tracks.reduce((s, t) => s + (t.trash || 0), 0);

  const avatarColor = profile?.avatar_color || "#ff2d78";
  const bio = profile?.bio || "";
  const initial = username ? username[0].toUpperCase() : "?";

  function handleTrackClick(track) {
    if (onOpenModal) {
      onOpenModal(track);
    } else {
      setSelectedTrack(track);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="user-profile-page"
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose} style={{ zIndex: 10 }}>✕</button>

        {loading ? (
          <div className="user-profile-loading">
            <div style={{ color: "var(--pink)", fontFamily: "var(--font-pixel)", fontSize: "12px", padding: "40px 20px", textAlign: "center" }}>
              LOADING...
            </div>
          </div>
        ) : (
          <>
            {/* Profile header */}
            <div className="user-profile-header">
              <div className="user-profile-avatar" style={{ background: avatarColor }}>
                {initial}
              </div>
              <div className="user-profile-info">
                <div className="user-profile-username">@{username}</div>
                {bio && <div className="user-profile-bio">{bio}</div>}
              </div>
            </div>

            {/* Stats */}
            <div className="user-profile-stats">
              <div className="stat-box">
                <div className="stat-value">{tracks.length}</div>
                <div className="stat-label">uploads</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ color: "var(--green)" }}>{totalHards}</div>
                <div className="stat-label">🔥 hards</div>
              </div>
              <div className="stat-box">
                <div className="stat-value" style={{ color: "#ff4444" }}>{totalTrash}</div>
                <div className="stat-label">💀 trash</div>
              </div>
            </div>

            {/* Their Tracks */}
            <div className="user-profile-tracks-section">
              <div className="section-title" style={{ padding: "0 16px", marginBottom: "8px" }}>
                🎵 THEIR TRACKS
              </div>

              {tracks.length === 0 ? (
                <div style={{ color: "#666", fontFamily: "var(--font-vt)", fontSize: "18px", padding: "16px", textAlign: "center" }}>
                  no tracks yet
                </div>
              ) : (
                <div className="user-profile-tracks-grid">
                  {tracks.map(track => {
                    const total = (track.hards || 0) + (track.trash || 0);
                    const hp = total > 0 ? Math.round((track.hards / total) * 100) : 0;
                    return (
                      <div
                        key={track.id}
                        className="user-profile-track-card"
                        onClick={() => handleTrackClick(track)}
                      >
                        <div
                          className="user-profile-track-thumb"
                          style={{ backgroundImage: `url(${track.coverUrl})` }}
                        />
                        <div className="user-profile-track-info">
                          <div className="user-profile-track-title">{track.title}</div>
                          <div className="user-profile-track-artist">{track.artist}</div>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center", marginTop: "3px" }}>
                            <span className="genre-tag" style={{ fontSize: "6px", padding: "2px 5px" }}>{track.genre}</span>
                            <span style={{ fontFamily: "var(--font-pixel)", fontSize: "7px", color: "var(--green)" }}>🔥{track.hards}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Inline TrackModal if no onOpenModal prop */}
      {selectedTrack && (
        <TrackModal
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          onVote={() => {}}
          userVotes={userVotes || {}}
        />
      )}
    </div>
  );
}
