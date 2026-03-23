import { useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase.js";

const GENRES = ["Hip-Hop", "R&B", "Drill", "Trap", "Afrobeats", "Jersey Club", "Hyperpop", "Indie", "Electronic", "Soul"];
const MAX_FILE_MB = 20;

function buildSCEmbedUrl(trackUrl) {
  return `https://w.soundcloud.com/player/?url=${encodeURIComponent(trackUrl)}&color=%23ff2d78&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
}

function isValidSCUrl(url) {
  return /soundcloud\.com\/[^/]+\/[^/]+/.test(url) && url.startsWith("http");
}

function guessFromSCUrl(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    const artist = (parts[0] || "Unknown").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    const title = (parts[1] || "Untitled").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return { artist, title };
  } catch { return { artist: "Unknown", title: "Untitled" }; }
}

// ─── MP3 Upload Tab ───────────────────────────────────────────────
function MP3Tab({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState(currentUser?.username || "");
  const [genre, setGenre] = useState("Hip-Hop");
  const [audioFile, setAudioFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const audioRef = useRef(null);
  const coverRef = useRef(null);

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) return setError(`Max ${MAX_FILE_MB}MB`);
    if (!file.type.startsWith("audio/")) return setError("Select an audio file");
    setAudioFile(file);
    setError("");
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Title required");
    if (!audioFile) return setError("Select an audio file");
    setUploading(true); setError("");

    try {
      setProgress("Uploading audio...");
      const audioExt = audioFile.name.split(".").pop();
      const audioPath = `${currentUser.id}/${Date.now()}.${audioExt}`;
      const { error: ae } = await supabase.storage.from("audio").upload(audioPath, audioFile, { contentType: audioFile.type });
      if (ae) throw new Error(ae.message);
      const audioUrl = supabase.storage.from("audio").getPublicUrl(audioPath).data.publicUrl;

      let coverUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80";
      if (coverFile) {
        setProgress("Uploading cover...");
        const coverExt = coverFile.name.split(".").pop();
        const coverPath = `${currentUser.id}/cover_${Date.now()}.${coverExt}`;
        const { error: ce } = await supabase.storage.from("covers").upload(coverPath, coverFile, { contentType: coverFile.type });
        if (!ce) coverUrl = supabase.storage.from("covers").getPublicUrl(coverPath).data.publicUrl;
      }

      setProgress("Saving...");
      const { data: track, error: te } = await supabase.from("tracks").insert({
        title: title.trim(), artist: artist.trim() || currentUser.username,
        genre, bpm: 0, cover_url: coverUrl, audio_url: audioUrl,
        snippet_start: 0, tags: [genre.toLowerCase()],
        uploaded_by: currentUser.id, uploaded_by_username: currentUser.username,
        hards: 0, trash: 0, listed_at: new Date().toISOString(),
      }).select().single();
      if (te) throw new Error(te.message);

      onSubmit({ id: track.id, title: track.title, artist: track.artist, genre: track.genre,
        bpm: 0, coverUrl: track.cover_url, audioUrl: track.audio_url, snippetStart: 0,
        tags: track.tags || [], uploadedBy: track.uploaded_by_username,
        listedAt: track.listed_at, hards: 0, trash: 0 });
    } catch (err) {
      setError(err.message);
    } finally { setUploading(false); setProgress(""); }
  };

  return (
    <div>
      <div className="upload-file-box" onClick={() => audioRef.current.click()}>
        {audioFile ? (
          <div className="upload-file-selected">🎵 {audioFile.name} <span className="upload-file-size">({(audioFile.size/1024/1024).toFixed(1)}MB)</span></div>
        ) : (
          <div><div className="upload-file-icon">🎵</div><div>Tap to select audio file</div><div className="upload-file-hint">MP3, WAV, AAC — max {MAX_FILE_MB}MB</div></div>
        )}
        <input ref={audioRef} type="file" accept="audio/*" style={{ display:"none" }} onChange={handleAudioChange} />
      </div>

      <div className="upload-cover-row">
        <div className="upload-cover-preview" onClick={() => coverRef.current.click()}>
          {coverPreview ? <img src={coverPreview} alt="cover"/> : <div className="upload-cover-empty">🖼️<br/>Cover</div>}
          <input ref={coverRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleCoverChange} />
        </div>
        <div className="upload-meta">
          <div className="sc-upload__field">
            <label className="sc-upload__label">TITLE</label>
            <input className="sc-upload__input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Track name..." disabled={uploading} />
          </div>
          <div className="sc-upload__field">
            <label className="sc-upload__label">ARTIST</label>
            <input className="sc-upload__input" type="text" value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist..." disabled={uploading} />
          </div>
        </div>
      </div>

      <div className="sc-upload__field">
        <label className="sc-upload__label">GENRE</label>
        <select className="sc-upload__select" value={genre} onChange={e => setGenre(e.target.value)} disabled={uploading}>
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {error && <div className="sc-upload__error">{error}</div>}
      {progress && <div className="upload-progress">{progress}</div>}

      <button className="btn-bevel btn-pink sc-upload__submit" onClick={handleSubmit} disabled={uploading || !audioFile || !title.trim()}>
        {uploading ? progress || "UPLOADING..." : "🔥 PUT IT ON THE BLOCK"}
      </button>
    </div>
  );
}

// ─── SoundCloud Tab ───────────────────────────────────────────────
function SoundCloudTab({ onSubmit, onCancel }) {
  const { currentUser } = useAuth();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState(currentUser?.username || "");
  const [genre, setGenre] = useState("Hip-Hop");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleLoad = () => {
    if (!isValidSCUrl(url)) return setError("Paste a full SoundCloud track URL");
    setError("");
    const guessed = guessFromSCUrl(url);
    if (!title) setTitle(guessed.title);
    if (!artist || artist === currentUser?.username) setArtist(guessed.artist);
    setPreview(true);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Title required");
    setSaving(true); setError("");
    try {
      const embedUrl = buildSCEmbedUrl(url);
      const { data: track, error: te } = await supabase.from("tracks").insert({
        title: title.trim(), artist: artist.trim() || currentUser.username,
        genre, bpm: 0,
        cover_url: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80",
        audio_url: url, // store SC url as audio_url
        snippet_start: 0, tags: [genre.toLowerCase()],
        uploaded_by: currentUser.id, uploaded_by_username: currentUser.username,
        hards: 0, trash: 0, listed_at: new Date().toISOString(),
        soundcloud_url: url, embed_url: embedUrl,
      }).select().single();
      if (te) throw new Error(te.message);

      onSubmit({ id: track.id, title: track.title, artist: track.artist, genre: track.genre,
        bpm: 0, coverUrl: track.cover_url, audioUrl: track.audio_url,
        soundcloudUrl: url, embedUrl, isSoundCloud: true,
        snippetStart: 0, tags: track.tags || [],
        uploadedBy: track.uploaded_by_username, listedAt: track.listed_at, hards: 0, trash: 0 });
    } catch (err) {
      setError(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="sc-upload__field">
        <input className="sc-upload__input" type="url" placeholder="https://soundcloud.com/artist/track"
          value={url} onChange={e => { setUrl(e.target.value); setPreview(false); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleLoad()} />
        <button className="btn-bevel btn-yellow sc-upload__fetch" onClick={handleLoad}>LOAD</button>
      </div>

      {error && <div className="sc-upload__error">{error}</div>}

      {preview && (
        <div className="sc-preview">
          <iframe className="sc-embed-iframe" scrolling="no" frameBorder="no" allow="autoplay"
            src={buildSCEmbedUrl(url)} title="SoundCloud preview" style={{ height: "300px" }} />

          <div className="sc-upload__field" style={{ marginTop: "12px" }}>
            <label className="sc-upload__label">TITLE</label>
            <input className="sc-upload__input" type="text" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="sc-upload__field">
            <label className="sc-upload__label">ARTIST</label>
            <input className="sc-upload__input" type="text" value={artist} onChange={e => setArtist(e.target.value)} />
          </div>
          <div className="sc-upload__field">
            <label className="sc-upload__label">GENRE</label>
            <select className="sc-upload__select" value={genre} onChange={e => setGenre(e.target.value)}>
              {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {error && <div className="sc-upload__error">{error}</div>}
          <button className="btn-bevel btn-pink sc-upload__submit" onClick={handleSubmit} disabled={saving}>
            {saving ? "SAVING..." : "🔥 PUT IT ON THE BLOCK"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────
export default function TrackUpload({ onSubmit, onCancel }) {
  const [tab, setTab] = useState("mp3");

  return (
    <div className="sc-upload">
      <div className="sc-upload__header">
        <h2 className="sc-upload__title">DROP YOUR TRACK</h2>
      </div>

      <div className="upload-tabs">
        <button className={`upload-tab ${tab === "mp3" ? "active" : ""}`} onClick={() => setTab("mp3")}>🎵 Upload MP3</button>
        <button className={`upload-tab ${tab === "sc" ? "active" : ""}`} onClick={() => setTab("sc")}>☁️ SoundCloud</button>
      </div>

      {tab === "mp3" ? <MP3Tab onSubmit={onSubmit} onCancel={onCancel} /> : <SoundCloudTab onSubmit={onSubmit} onCancel={onCancel} />}

      <button className="sc-upload__cancel" onClick={onCancel}>cancel</button>
    </div>
  );
}
