import React, { useState } from "react";
import TrackModal from "./TrackModal.jsx";

const RANK_STYLE = {
  1: { label: "🥇", color: "#ffd700", border: "2px solid #ffd700" },
  2: { label: "🥈", color: "#c0c0c0", border: "2px solid #c0c0c0" },
  3: { label: "🥉", color: "#cd7f32", border: "2px solid #cd7f32" },
};

export default function LeaderboardPage({ tracks, onVote, userVotes, onViewUser }) {
  const [selectedTrack, setSelectedTrack] = useState(null);

  const sorted = [...tracks].sort((a, b) => b.hards - a.hards);

  return (
    <div className="leaderboard-page">
      <div className="page-header">
        <h1 className="page-title">🔥 LEADERBOARD</h1>
        <p className="page-subtitle">hardest tracks right now</p>
      </div>

      <div className="leaderboard-list">
        {sorted.map((track, idx) => {
          const rank = idx + 1;
          const rankStyle = RANK_STYLE[rank] || {};

          return (
            <div
              key={track.id}
              className={`leaderboard-row ${rank <= 3 ? "leaderboard-row--top" : ""}`}
              style={rank <= 3 ? { border: rankStyle.border } : {}}
              onClick={() => setSelectedTrack(track)}
            >
              <div
                className="leaderboard-rank"
                style={rank <= 3 ? { color: rankStyle.color } : {}}
              >
                {rank <= 3 ? rankStyle.label : `#${rank}`}
              </div>

              <div
                className="leaderboard-thumb"
                style={{ backgroundImage: `url(${track.coverUrl})` }}
              />

              <div className="leaderboard-info">
                <div className="leaderboard-title">{track.title}</div>
                <div className="leaderboard-artist">{track.artist}</div>
                <div className="leaderboard-genre">{track.genre}</div>
              </div>

              <div className="leaderboard-hards">
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
