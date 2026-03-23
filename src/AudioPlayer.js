/**
 * AudioPlayer — wraps HTMLAudioElement for 15-second snippet playback.
 * Uses HTMLAudioElement (widely supported) instead of Web Audio API
 * to avoid cross-origin fetch restrictions on audio files.
 */
export default class AudioPlayer {
  constructor(audioUrl, snippetStart = 0) {
    this.audioUrl = audioUrl;
    this.snippetStart = snippetStart;
    this.snippetDuration = 15;
    this._timeUpdateCb = null;
    this._endedCb = null;
    this._audio = null;
    this._stopTimer = null;
    this._rafId = null;
    this._startTime = null;
    this._isPlaying = false;
    this._destroyed = false;
  }

  _ensureAudio() {
    if (!this._audio) {
      this._audio = new Audio();
      this._audio.src = this.audioUrl;
      this._audio.preload = "auto";

      this._audio.addEventListener("ended", () => {
        this._cleanup();
        if (this._endedCb) this._endedCb();
      });
    }
    return this._audio;
  }

  play() {
    if (this._destroyed) return;
    const audio = this._ensureAudio();

    // Seek to snippet start
    try {
      if (audio.readyState >= 1 && isFinite(audio.duration)) {
        audio.currentTime = this.snippetStart;
      } else {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          audio.currentTime = this.snippetStart;
        };
        audio.addEventListener("canplay", onCanPlay);
      }
    } catch (e) {
      console.warn("AudioPlayer seek error:", e);
    }

    const playPromise = audio.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch((e) => {
        console.error("AudioPlayer play error:", e.name, e.message, this.audioUrl);
      });
    }

    this._isPlaying = true;
    this._startTime = Date.now();

    // Auto-stop after 15 seconds
    if (this._stopTimer) clearTimeout(this._stopTimer);
    this._stopTimer = setTimeout(() => {
      this._cleanup();
      if (this._endedCb) this._endedCb();
    }, this.snippetDuration * 1000);

    // RAF loop for progress
    this._startRAF();
  }

  _startRAF() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    const tick = () => {
      if (!this._isPlaying || this._destroyed) return;
      if (this._timeUpdateCb && this._startTime !== null) {
        const elapsed = (Date.now() - this._startTime) / 1000;
        const progress = Math.min(elapsed / this.snippetDuration, 1);
        this._timeUpdateCb(progress);
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  }

  pause() {
    if (!this._audio) return;
    this._audio.pause();
    this._isPlaying = false;
    if (this._stopTimer) { clearTimeout(this._stopTimer); this._stopTimer = null; }
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
  }

  stop() {
    this._cleanup();
  }

  _cleanup() {
    this._isPlaying = false;
    if (this._stopTimer) { clearTimeout(this._stopTimer); this._stopTimer = null; }
    if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; }
    if (this._audio) {
      this._audio.pause();
      try { this._audio.currentTime = 0; } catch (_) {}
    }
  }

  onTimeUpdate(callback) {
    this._timeUpdateCb = callback;
  }

  onEnded(callback) {
    this._endedCb = callback;
  }

  destroy() {
    this._destroyed = true;
    this._cleanup();
    if (this._audio) {
      this._audio.src = "";
      this._audio = null;
    }
    this._timeUpdateCb = null;
    this._endedCb = null;
  }
}
