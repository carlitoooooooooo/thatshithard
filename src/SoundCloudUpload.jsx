import { useState } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase.js";

const GENRES = ["Hip-Hop", "R&B", "Drill", "Trap", "Afrobeats", "Jersey Club", "Hyperpop", "Indie", "Electronic", "Soul"];

function isValidSCUrl(url) {
  return /soundcloud\.com\/[^/]+\/[^/]+/.test(url) && url.startsWith("http");
}

function buildEmbedUrl(trackUrl) {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff2d78&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
}

function guessFromUrl(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const artist = parts[0]?.replace(/-/g, " ") || "Unknown Artist";
    const title = parts[1]?.replace(/-/g, " ") || "Untitled";
    return {
      artist: artist.replace(/\b\w/g, l => l.toUpperCase()),
      title: title.replace(/\b\w/g, l => l.toUpperCase()),
    };
  } catch {
    return { artist: "Unknown Artist", title: "Untitled" };
  }
}

export default function SoundCloudUpload({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const [url, setUrl] = useState("");
  const [genre, setGenre] = useState("Hip-Hop");
  const [artistOverride, setArtistOverride] = useState("");
  const [titleOverride, setTitleOverride] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLoad = () => {
    if (!isValidSCUrl(url)) {
      setError("Paste a full SoundCloud track URL (e.g. soundcloud.com/artist/track)");
      return;
    }
    setError("");
    const guessed = guessFromUrl(url);
    if (!artistOverride) setArtistOverride(guessed.artist);
    if (!titleOverride) setTitleOverride(guessed.title);
    setPreview(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    const guessed = guessFromUrl(url);
    const title = titleOverride || guessed.title;
    const artist = artistOverride || guessed.artist;

    const trackData = {
      title,
      artist,
      genre,
      bpm: 0,
      cover_url: `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80`,
      audio_url: null,
      soundcloud_url: url,
      embed_url: buildEmbedUrl(url),
      snippet_start: 0,
      hards: 0,
      trash: 0,
      uploaded_by: currentUser?.id || null,
      uploaded_by_username: currentUser?.username || "anonymous",
      listed_at: new Date().toISOString(),
      tags: [genre.toLowerCase()],
    };

    try {
      const { data, error: insertError } = await supabase
        .from('tracks')
        .insert(trackData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Build UI-friendly track object
      const uiTrack = {
        id: data.id,
        title: data.title,
        artist: data.artist,
        genre: data.genre,
        bpm: data.bpm || 0,
        coverUrl: data.cover_url || "",
        audioUrl: data.audio_url || "",
        soundcloudUrl: data.soundcloud_url,
        embedUrl: data.embed_url,
        snippetStart: data.snippet_start || 0,
        hards: 0,
        trash: 0,
        uploadedBy: data.uploaded_by_username,
        listedAt: data.listed_at,
        tags: data.tags || [],
        isSoundCloud: true,
      };

      onSubmit(uiTrack);
    } catch (err) {
      console.error('Track insert error:', err);
      setError(err.message || "Failed to drop track. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="sc-upload">
      <div className="sc-upload__header">
        <h2 className="sc-upload__title">DROP YOUR TRACK</h2>
        <p className="sc-upload__sub">Paste a public SoundCloud track link</p>
      </div>

      <div className="sc-upload__field">
        <input
          className="sc-upload__input"
          type="url"
          placeholder="https://soundcloud.com/artist/track-name"
          value={url}
          onChange={e => { setUrl(e.target.value); setPreview(false); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLoad()}
          disabled={submitting}
        />
        <button className="btn-bevel btn-yellow sc-upload__fetch" onClick={handleLoad} disabled={submitting}>
          LOAD
        </button>
      </div>

      {error && <div className="sc-upload__error">{error}</div>}

      {preview && (
        <div className="sc-preview">
          <iframe
            className="sc-embed-iframe"
            scrolling="no"
            frameBorder="no"
            allow="autoplay"
            src={buildEmbedUrl(url)}
            title="SoundCloud preview"
          />

          <div className="sc-upload__field" style={{ marginTop: "12px" }}>
            <label className="sc-upload__label">ARTIST NAME</label>
            <input
              className="sc-upload__input"
              type="text"
              value={artistOverride}
              onChange={e => setArtistOverride(e.target.value)}
              placeholder="Artist name"
              disabled={submitting}
            />
          </div>

          <div className="sc-upload__field">
            <label className="sc-upload__label">TRACK TITLE</label>
            <input
              className="sc-upload__input"
              type="text"
              value={titleOverride}
              onChange={e => setTitleOverride(e.target.value)}
              placeholder="Track title"
              disabled={submitting}
            />
          </div>

          <div className="sc-upload__field">
            <label className="sc-upload__label">GENRE</label>
            <select
              className="sc-upload__select"
              value={genre}
              onChange={e => setGenre(e.target.value)}
              disabled={submitting}
            >
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <button
            className="btn-bevel btn-pink sc-upload__submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "DROPPING..." : "🔥 PUT IT ON THE BLOCK"}
          </button>
        </div>
      )}

      <button className="sc-upload__cancel" onClick={onCancel} disabled={submitting}>cancel</button>
    </div>
  );
}
