import { useState, useRef } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "./supabase.js";

const GENRES = ["Hip-Hop", "R&B", "Drill", "Trap", "Afrobeats", "Jersey Club", "Hyperpop", "Indie", "Electronic", "Soul"];
const MAX_FILE_MB = 20;

export default function TrackUpload({ onSubmit, onCancel }) {
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
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`File too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }
    if (!file.type.startsWith("audio/")) {
      setError("Please select an audio file (MP3, WAV, etc.)");
      return;
    }
    setAudioFile(file);
    setError("");
    // Auto-fill title from filename
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "));
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image for the cover");
      return;
    }
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setError("");
  };

  const handleSubmit = async () => {
    if (!title.trim()) return setError("Track title required");
    if (!audioFile) return setError("Please select an audio file");

    setUploading(true);
    setError("");

    try {
      // 1. Upload audio to Supabase Storage
      setProgress("Uploading audio...");
      const audioExt = audioFile.name.split(".").pop();
      const audioPath = `${currentUser.id}/${Date.now()}.${audioExt}`;

      const { error: audioError } = await supabase.storage
        .from("audio")
        .upload(audioPath, audioFile, { contentType: audioFile.type });

      if (audioError) throw new Error("Audio upload failed: " + audioError.message);

      const { data: audioUrlData } = supabase.storage.from("audio").getPublicUrl(audioPath);
      const audioUrl = audioUrlData.publicUrl;

      // 2. Upload cover if provided
      let coverUrl = `https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&q=80`;
      if (coverFile) {
        setProgress("Uploading cover...");
        const coverExt = coverFile.name.split(".").pop();
        const coverPath = `${currentUser.id}/${Date.now()}.${coverExt}`;

        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverPath, coverFile, { contentType: coverFile.type });

        if (!coverError) {
          const { data: coverUrlData } = supabase.storage.from("covers").getPublicUrl(coverPath);
          coverUrl = coverUrlData.publicUrl;
        }
      }

      // 3. Insert track into DB
      setProgress("Saving track...");
      const { data: track, error: trackError } = await supabase
        .from("tracks")
        .insert({
          title: title.trim(),
          artist: artist.trim() || currentUser.username,
          genre,
          bpm: 0,
          cover_url: coverUrl,
          audio_url: audioUrl,
          snippet_start: 0,
          tags: [genre.toLowerCase()],
          uploaded_by: currentUser.id,
          uploaded_by_username: currentUser.username,
          hards: 0,
          trash: 0,
          listed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (trackError) throw new Error("Failed to save track: " + trackError.message);

      setProgress("Done!");

      // Map to camelCase for UI
      onSubmit({
        id: track.id,
        title: track.title,
        artist: track.artist,
        genre: track.genre,
        bpm: 0,
        coverUrl: track.cover_url,
        audioUrl: track.audio_url,
        snippetStart: 0,
        tags: track.tags || [],
        uploadedBy: track.uploaded_by_username,
        listedAt: track.listed_at,
        hards: 0,
        trash: 0,
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      setProgress("");
    }
  };

  return (
    <div className="sc-upload">
      <div className="sc-upload__header">
        <h2 className="sc-upload__title">DROP YOUR TRACK</h2>
        <p className="sc-upload__sub">Upload an MP3 or WAV (max {MAX_FILE_MB}MB)</p>
      </div>

      {/* Audio file picker */}
      <div className="upload-file-box" onClick={() => audioRef.current.click()}>
        {audioFile ? (
          <div className="upload-file-selected">
            <span>🎵</span>
            <span>{audioFile.name}</span>
            <span className="upload-file-size">({(audioFile.size / 1024 / 1024).toFixed(1)}MB)</span>
          </div>
        ) : (
          <div className="upload-file-placeholder">
            <div className="upload-file-icon">🎵</div>
            <div>Tap to select audio file</div>
            <div className="upload-file-hint">MP3, WAV, AAC supported</div>
          </div>
        )}
        <input
          ref={audioRef}
          type="file"
          accept="audio/*"
          style={{ display: "none" }}
          onChange={handleAudioChange}
        />
      </div>

      {/* Cover art picker */}
      <div className="upload-cover-row">
        <div className="upload-cover-preview" onClick={() => coverRef.current.click()}>
          {coverPreview ? (
            <img src={coverPreview} alt="cover" />
          ) : (
            <div className="upload-cover-empty">🖼️<br/>Cover</div>
          )}
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleCoverChange}
          />
        </div>

        <div className="upload-meta">
          <div className="sc-upload__field">
            <label className="sc-upload__label">TRACK TITLE</label>
            <input
              className="sc-upload__input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Track name..."
              disabled={uploading}
            />
          </div>
          <div className="sc-upload__field">
            <label className="sc-upload__label">ARTIST</label>
            <input
              className="sc-upload__input"
              type="text"
              value={artist}
              onChange={e => setArtist(e.target.value)}
              placeholder="Artist name..."
              disabled={uploading}
            />
          </div>
        </div>
      </div>

      <div className="sc-upload__field">
        <label className="sc-upload__label">GENRE</label>
        <select
          className="sc-upload__select"
          value={genre}
          onChange={e => setGenre(e.target.value)}
          disabled={uploading}
        >
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      {error && <div className="sc-upload__error">{error}</div>}
      {progress && <div className="upload-progress">{progress}</div>}

      <button
        className="btn-bevel btn-pink sc-upload__submit"
        onClick={handleSubmit}
        disabled={uploading || !audioFile || !title.trim()}
      >
        {uploading ? progress || "UPLOADING..." : "🔥 PUT IT ON THE BLOCK"}
      </button>

      <button className="sc-upload__cancel" onClick={onCancel} disabled={uploading}>cancel</button>
    </div>
  );
}
