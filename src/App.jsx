import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";
import { useAuth } from "./AuthContext.jsx";
import AuthScreen from "./AuthScreen.jsx";
import SwipeCard from "./SwipeCard.jsx";
import LeaderboardPage from "./LeaderboardPage.jsx";
import ProfilePage from "./ProfilePage.jsx";
import ChartsPage from "./ChartsPage.jsx";
import TrackModal from "./TrackModal.jsx";
import Background from "./Background.jsx";
import ReactionPicker from "./ReactionPicker.jsx";
import GraffitiLogo from "./GraffitiLogo.jsx";
import TrackUpload from "./TrackUpload.jsx";
import { FireAnimation, TrashAnimation } from "./SwipeAnimations.jsx";
import tracksData from "./tracks.js";
import { supabase } from "./supabase.js";

const TABS = [
  { id: "discover", label: "🎵 Discover" },
  { id: "leaderboard", label: "🔥 Board" },
  { id: "charts", label: "📊 Charts" },
  { id: "profile", label: "👤 Profile" },
];

const GENRES = ["ALL", "Hip-Hop", "R&B", "Drill", "Trap", "Afrobeats", "Jersey Club", "Hyperpop", "Indie", "Electronic", "Soul"];

const SEEN_KEY = (username) => `tsh_seen_${username}`;

function loadSeen(username) {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY(username)) || "[]"); } catch { return []; }
}
function saveSeen(username, seen) {
  localStorage.setItem(SEEN_KEY(username), JSON.stringify(seen));
}

// Map DB snake_case to camelCase for UI
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

// Map tracks.js camelCase to DB snake_case for seeding
function mapTrackToDb(t) {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist,
    genre: t.genre,
    bpm: t.bpm || 0,
    cover_url: t.coverUrl || "",
    audio_url: t.audioUrl || "",
    snippet_start: t.snippetStart || 0,
    tags: t.tags || [],
    uploaded_by: null,
    uploaded_by_username: "tsh_admin",
    hards: t.hards || 0,
    trash: t.trash || 0,
    listed_at: t.listedAt || new Date().toISOString(),
  };
}

function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? "toast--visible" : ""} ${message?.includes("HARD") ? "toast--hard" : "toast--trash"}`}>
      {message}
    </div>
  );
}

export default function App() {
  const { currentUser, authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [tracksError, setTracksError] = useState(null);
  const [queue, setQueue] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [toast, setToast] = useState({ message: "", visible: false });
  const [activeGenre, setActiveGenre] = useState("ALL");
  const [reactionTarget, setReactionTarget] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const toastTimer = useRef(null);

  // Load tracks — show cached instantly, then refresh in background
  useEffect(() => {
    async function loadTracks() {
      // Show cached tracks instantly
      const cached = localStorage.getItem('tsh_tracks_cache');
      if (cached) {
        try {
          setTracks(JSON.parse(cached));
          setTracksLoading(false);
        } catch {}
      }

      try {
        // Check if needs seeding
        const { count } = await supabase.from('tracks').select('*', { count: 'exact', head: true });
        if (count === 0) {
          const seedData = tracksData.map(mapTrackToDb);
          await supabase.from('tracks').insert(seedData);
        }

        // Fetch fresh tracks
        const { data, error } = await supabase.from('tracks').select('*').order('listed_at', { ascending: false });
        if (error) throw error;

        const mapped = (data || []).map(mapTrack);
        setTracks(mapped);
        localStorage.setItem('tsh_tracks_cache', JSON.stringify(mapped));
      } catch (err) {
        // Fall back to static data if no cache
        if (!localStorage.getItem('tsh_tracks_cache')) {
          setTracks(tracksData.map(t => ({ ...t, coverUrl: t.coverUrl, audioUrl: t.audioUrl, listedAt: t.listedAt, uploadedBy: t.uploadedBy })));
        }
      } finally {
        setTracksLoading(false);
      }
    }

    loadTracks();
  }, []);

  // Load user votes from Supabase when user logs in
  useEffect(() => {
    if (!currentUser) return;

    async function loadUserVotes() {
      try {
        const { data, error } = await supabase
          .from('votes')
          .select('track_id, vote')
          .eq('user_id', currentUser.id);

        if (error) throw error;

        const votesMap = {};
        (data || []).forEach(v => {
          votesMap[v.track_id] = v.vote;
        });
        setUserVotes(votesMap);
      } catch (err) {
        console.error('Load votes error:', err);
      }
    }

    loadUserVotes();
  }, [currentUser?.id]);

  // Build queue once tracks and votes are loaded
  useEffect(() => {
    if (!currentUser || tracksLoading || tracks.length === 0) return;

    const seen = loadSeen(currentUser.username);
    const votedIds = Object.keys(userVotes).map(String);
    const seenSet = new Set([...seen.map(String), ...votedIds]);

    const unseen = tracks.filter(t => !seenSet.has(String(t.id)));
    const shuffled = [...unseen].sort(() => Math.random() - 0.5);
    setQueue(shuffled);
  }, [currentUser?.id, tracksLoading, tracks.length > 0, Object.keys(userVotes).length]);

  const showToast = useCallback((msg) => {
    setToast({ message: msg, visible: true });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 1500);
  }, []);

  const handleSwipe = useCallback(async (dir, track) => {
    if (!currentUser) return;

    // Optimistic update
    setUserVotes(prev => ({ ...prev, [track.id]: dir }));
    setTracks(prev =>
      prev.map(t => {
        if (t.id !== track.id) return t;
        return {
          ...t,
          hards: t.hards + (dir === "right" ? 1 : 0),
          trash: t.trash + (dir === "left" ? 1 : 0),
        };
      })
    );
    setQueue(prev => prev.filter(t => t.id !== track.id));

    // Save seen to localStorage
    const seen = loadSeen(currentUser.username);
    if (!seen.includes(track.id)) {
      saveSeen(currentUser.username, [...seen, track.id]);
    }

    showToast(dir === "right" ? "🔥 HARD!" : "💀 TRASH");
    setReactionTarget({ trackId: track.id });

    // Persist vote to Supabase
    try {
      await supabase.from('votes').upsert({
        user_id: currentUser.id,
        track_id: track.id,
        vote: dir,
      }, { onConflict: 'user_id,track_id' });

      // Increment the relevant counter on the track
      const field = dir === "right" ? "hards" : "trash";
      const { data: trackData } = await supabase
        .from('tracks')
        .select('hards, trash')
        .eq('id', track.id)
        .single();
      if (trackData) {
        await supabase
          .from('tracks')
          .update({ [field]: (trackData[field] || 0) + 1 })
          .eq('id', track.id);
      }
    } catch (err) {
      console.error('Vote save error:', err);
    }
  }, [currentUser, showToast]);

  const handleVoteFromModal = useCallback((dir, track) => {
    handleSwipe(dir, track);
  }, [handleSwipe]);

  const handleSoundCloudSubmit = useCallback((track) => {
    // Clear cache so next load fetches fresh
    localStorage.removeItem('tsh_tracks_cache');
    // Add to current state immediately
    setTracks(prev => {
      const updated = [track, ...prev];
      localStorage.setItem('tsh_tracks_cache', JSON.stringify(updated));
      return updated;
    });
    setQueue(prev => [track, ...prev]);
    setShowUpload(false);
    showToast("🔥 TRACK DROPPED!");
  }, [showToast]);

  const handleReactionDismiss = useCallback(() => {
    setReactionTarget(null);
  }, []);

  // Show loading while auth initializes
  if (authLoading) {
    return (
      <div className="app">
        <Background />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--pink)", fontSize: "18px", fontFamily: "monospace" }}>
          LOADING...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthScreen />;
  }

  // Filter queue by genre
  const filteredQueue = activeGenre === "ALL"
    ? queue
    : queue.filter((t) => t.genre === activeGenre);

  const stackedCards = filteredQueue.slice(0, 4);

  return (
    <div className="app">
      <Background />
      <div className="spray-bg" />

      <header className="app-header">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <GraffitiLogo />
          <span className="beta-tag">BETA</span>
        </div>
        <button className="btn-upload" onClick={() => setShowUpload(true)}>
          + DROP
        </button>
      </header>

      <main className="app-main">
        {activeTab === "discover" && (
          <div className="discover-view">
            {/* Genre Filter Bar */}
            <div className="genre-filter-bar">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  className={`genre-pill ${activeGenre === genre ? "genre-pill--active" : ""}`}
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>

            {tracksLoading ? (
              <div className="empty-queue">
                <div className="empty-queue__icon">⏳</div>
                <div className="empty-queue__text">LOADING TRACKS...</div>
              </div>
            ) : tracksError ? (
              <div className="empty-queue">
                <div className="empty-queue__icon">⚠️</div>
                <div className="empty-queue__text">Failed to load</div>
                <div className="empty-queue__sub">{tracksError}</div>
              </div>
            ) : filteredQueue.length === 0 ? (
              <div className="empty-queue">
                <div className="empty-queue__icon">🎧</div>
                <div className="empty-queue__text">
                  {activeGenre === "ALL" ? "You've heard it all!" : `No more ${activeGenre}`}
                </div>
                <div className="empty-queue__sub">
                  {activeGenre === "ALL" ? "Check the leaderboard 🔥" : "Try another genre 👆"}
                </div>
                {activeGenre === "ALL" && (
                  <button
                    className="btn-bevel btn-pink"
                    style={{ marginTop: "16px" }}
                    onClick={() => {
                      const shuffled = [...tracks].sort(() => Math.random() - 0.5);
                      setQueue(shuffled);
                      saveSeen(currentUser.username, []);
                      setUserVotes({});
                    }}
                  >
                    🔄 START OVER
                  </button>
                )}
                {activeGenre !== "ALL" && (
                  <button
                    className="btn-bevel btn-yellow"
                    style={{ marginTop: "16px" }}
                    onClick={() => setActiveGenre("ALL")}
                  >
                    SHOW ALL
                  </button>
                )}
              </div>
            ) : (
              <div className="card-stack">
                {stackedCards.map((track, idx) => (
                  <SwipeCard
                    key={track.id}
                    track={track}
                    isTop={idx === 0}
                    stackIndex={idx}
                    onSwipe={handleSwipe}
                  />
                ))}
              </div>
            )}

            {!tracksLoading && !tracksError && filteredQueue.length > 0 && (
              <div className="discover-swipe-hint">
                <span>← TRASH</span>
                <span className="hint-count">{filteredQueue.length} left</span>
                <span>HARD →</span>
              </div>
            )}
          </div>
        )}

        {activeTab === "leaderboard" && (
          <LeaderboardPage
            tracks={tracks}
            onVote={handleVoteFromModal}
            userVotes={userVotes}
          />
        )}

        {activeTab === "charts" && (
          <ChartsPage
            tracks={tracks}
            onVote={handleVoteFromModal}
            userVotes={userVotes}
          />
        )}

        {activeTab === "profile" && (
          <ProfilePage userVotes={userVotes} tracks={tracks} />
        )}
      </main>

      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? "nav-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <Toast message={toast.message} visible={toast.visible} />

      {/* Reaction Picker */}
      {reactionTarget && (
        <ReactionPicker
          trackId={reactionTarget.trackId}
          username={currentUser.username}
          onDismiss={handleReactionDismiss}
        />
      )}

      {/* SoundCloud Upload Modal */}
      {showUpload && (
        <div className="modal-overlay" onClick={() => setShowUpload(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <TrackUpload
              onSubmit={handleSoundCloudSubmit}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
