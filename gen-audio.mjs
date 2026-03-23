// Generate simple WAV files with different tones — no external deps
import fs from "fs";
import path from "path";

const outDir = "./public/audio";
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

function writeWav(filename, frequencyHz, durationSec = 20, sampleRate = 22050) {
  const numSamples = sampleRate * durationSec;
  const dataSize = numSamples * 2; // 16-bit = 2 bytes per sample
  const buf = Buffer.alloc(44 + dataSize);

  // WAV header
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);         // chunk size
  buf.writeUInt16LE(1, 20);          // PCM
  buf.writeUInt16LE(1, 22);          // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);          // block align
  buf.writeUInt16LE(16, 34);         // bits per sample
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);

  // Generate a beat-like pattern: mix of frequencies with envelope
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Mix fundamental + harmonics for a richer sound
    let sample = 0;
    sample += 0.4 * Math.sin(2 * Math.PI * frequencyHz * t);
    sample += 0.2 * Math.sin(2 * Math.PI * frequencyHz * 2 * t);
    sample += 0.1 * Math.sin(2 * Math.PI * frequencyHz * 3 * t);
    // Add subtle low pulse (kick-like)
    const beatHz = 2;
    sample += 0.3 * Math.sin(2 * Math.PI * 60 * t) * Math.max(0, Math.sin(2 * Math.PI * beatHz * t));
    // Clamp
    sample = Math.max(-1, Math.min(1, sample));
    buf.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  const outPath = path.join(outDir, filename);
  fs.writeFileSync(outPath, buf);
  console.log(`Generated ${filename} (${Math.round(buf.length / 1024)}KB)`);
}

// Generate 5 tracks with different root frequencies
writeWav("track1.mp3", 110);  // A2 — deep/low
writeWav("track2.mp3", 138);  // trap-ish tempo feel
writeWav("track3.mp3", 165);  // E3
writeWav("track4.mp3", 196);  // G3
writeWav("track5.mp3", 220);  // A3

console.log("Done!");
