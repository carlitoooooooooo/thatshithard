import React, { useState } from "react";
import TrackModal from "./TrackModal.jsx";

const RANK_STYLE = {
  1: { label: "#1", color: "#ffd700", border: "2px solid #ffd700", bg: "rgba(255,215,0,0.06)" },
  2: { label: "#2", color: "#c0c0c0", border: "2px solid #c0c0c0", bg: "rgba(192,192,192,0.04)" },
  3: { label: "#3", color: "#cd7f32", border: "2px solid #cd7f32", bg: "rgba(205,127,50,0.06)" },
};

export default function ChartsPage({ tracks, onVote, userVotes, onViewUser }) {
  const [selectedTrack, setSelectedTrack] = useState(null);

  // Filter to "this week" — last 7 days
  const now = new Date();
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

  const recent = tracks.filter((t) => {
    if (!t.listedAt) return false;
    return new Date(t.listedAt) >= weekAgo;
  });

  // Use recent tracks if 10+, otherwise fall back to all sorted by hards
  const pool = recent.length >= 10 ? recent : tracks;
  const sorted = [...pool].sort((a, b) => b.hards - a.hards).slice(0, 10);

  return (
    <div className="charts-page">
      <div className="page-header">
        <h1 className="page-title">📊 THIS WEEK'S TOP 10</h1>
        <p className="page-subtitle">
          {recent.length >= 10 ? "tracks from the last 7 days" : "hardest tracks overall"}
        </p>
      </div>

      <div className="charts-list">
        {sorted.map((track, idx) => {
          const rank = idx + 1;
          const rs = RANK_STYLE[rank] || {};
          return (
            <div
              key={track.id}
              className={`charts-row ${rank <= 3 ? "charts-row--top" : ""}`}
              style={rank <= 3 ? { border: rs.border, background: rs.bg } : {}}
              onClick={() => setSelectedTrack(track)}
            >
              <div
                className="charts-rank"
                style={rank <= 3 ? { color: rs.color } : {}}
              >
                {rs.label || `#${rank}`}
              </div>

              <div
                className="charts-thumb"
                style={{ backgroundImage: `url(${track.coverUrl})` }}
              />

              <div className="charts-info">
                <div className="charts-title">{track.title}</div>
                <div className="charts-artist">{track.artist}</div>
                <div className="charts-genre">
                  <span className="genre-tag">{track.genre}</span>
                </div>
              </div>

              <div className="charts-hards">
                <span className="hards-count">🔥 {track.hards.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTrack && (
        <TrackModal
          track={selectedTrack}
          onClose={() => setSelectedTrack(null)}
          onVote={(dir, track) => { onVote(dir, track); setSelectedTrack(null); }}
          userVotes={userVotes}
          onViewUser={onViewUser}
        />
      )}
    </div>
  );
}
