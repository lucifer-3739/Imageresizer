import fs from 'fs';
import path from 'path';

function generateWav(durationSeconds, sampleRate, generatorFn) {
  const numChannels = 2;
  const bitDepth = 16;
  const numSamples = Math.floor(durationSeconds * sampleRate);
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const buffer = Buffer.alloc(totalSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const [left, right] = generatorFn(t, durationSeconds);

    const sL = Math.max(-1, Math.min(1, left));
    const sR = Math.max(-1, Math.min(1, right));

    buffer.writeInt16LE(sL < 0 ? sL * 0x8000 : sL * 0x7fff, offset);
    buffer.writeInt16LE(sR < 0 ? sR * 0x8000 : sR * 0x7fff, offset + 2);
    offset += 4;
  }

  return buffer;
}

const dir = path.resolve('public/samples');
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// 1. Lo-Fi Chill Beat (Rhodes chords + soft sub + vinyl noise)
const lofiWav = generateWav(15, 44100, (t, dur) => {
  const chordProg = [
    [261.63, 329.63, 392.0, 493.88], // Cmaj7
    [220.0, 261.63, 329.63, 392.0],  // Am7
    [174.61, 220.0, 261.63, 329.63], // Fmaj7
    [196.0, 246.94, 293.66, 392.0],  // G7
  ];
  const bar = Math.floor((t * 1.5) % chordProg.length);
  const notes = chordProg[bar];

  let left = 0;
  let right = 0;

  // Chords
  for (let idx = 0; idx < notes.length; idx++) {
    const freq = notes[idx];
    const trem = 1 + 0.15 * Math.sin(2 * Math.PI * 4 * t);
    const env = 0.5 * Math.exp(-((t * 1.5) % 1) * 2.5);
    const osc = Math.sin(2 * Math.PI * freq * t) * env * trem;
    left += osc * 0.15 * (idx % 2 === 0 ? 0.9 : 0.6);
    right += osc * 0.15 * (idx % 2 === 0 ? 0.6 : 0.9);
  }

  // Bass
  const bassFreq = notes[0] / 2;
  const bass = Math.sin(2 * Math.PI * bassFreq * t) * 0.25;
  left += bass;
  right += bass;

  // Soft beat (kick & snare)
  const beatTime = (t * 2) % 1;
  const isKick = Math.floor(t * 2) % 2 === 0;
  if (isKick) {
    const kickEnv = Math.exp(-beatTime * 15);
    const kick = Math.sin(2 * Math.PI * (80 * Math.exp(-beatTime * 20)) * beatTime) * kickEnv * 0.4;
    left += kick;
    right += kick;
  } else {
    const snareEnv = Math.exp(-beatTime * 12);
    const noise = (Math.random() * 2 - 1) * snareEnv * 0.2;
    left += noise;
    right += noise;
  }

  return [left, right];
});

fs.writeFileSync('public/samples/lofi-chill.wav', lofiWav);

// 2. Synthwave Neon (Arpeggiator + 80s bassline + stereo synth)
const synthwaveWav = generateWav(12, 44100, (t, dur) => {
  const arpNotes = [220.0, 277.18, 329.63, 440.0, 554.37, 659.25, 554.37, 440.0];
  const step = Math.floor(t * 8) % arpNotes.length;
  const freq = arpNotes[step];
  const env = Math.exp(-((t * 8) % 1) * 6);
  const saw = (2 * ((freq * t) % 1) - 1) * env * 0.25;

  // Panning arp
  const pan = Math.sin(2 * Math.PI * 1 * t);
  let left = saw * (0.5 - 0.3 * pan);
  let right = saw * (0.5 + 0.3 * pan);

  // Rolling 16th bass
  const bassStep = Math.floor(t * 8) % 2;
  const bassFreq = 110.0;
  const bassEnv = Math.exp(-((t * 8) % 1) * 8);
  const bass = (2 * ((bassFreq * t) % 1) - 1) * bassEnv * 0.3;
  left += bass;
  right += bass;

  return [left, right];
});

fs.writeFileSync('public/samples/synthwave-dream.wav', synthwaveWav);

// 3. Acoustic Guitar Melodic Strum
const acousticWav = generateWav(10, 44100, (t, dur) => {
  const chords = [329.63, 246.94, 196.0, 164.81, 123.47, 82.41]; // E minor
  let left = 0;
  let right = 0;

  for (let i = 0; i < chords.length; i++) {
    const stringDelay = i * 0.04;
    const stringTime = ((t + stringDelay) * 1.2) % 2;
    const freq = chords[i];
    const env = Math.exp(-stringTime * 3);
    const harmonic1 = Math.sin(2 * Math.PI * freq * t);
    const harmonic2 = 0.5 * Math.sin(2 * Math.PI * freq * 2 * t);
    const sound = (harmonic1 + harmonic2) * env * 0.12;

    left += sound * (i < 3 ? 0.8 : 0.4);
    right += sound * (i >= 3 ? 0.8 : 0.4);
  }

  return [left, right];
});

fs.writeFileSync('public/samples/acoustic-guitar.wav', acousticWav);

// 4. Ambient Piano Peaceful
const pianoWav = generateWav(14, 44100, (t, dur) => {
  const notes = [
    { f: 523.25, time: 0 },
    { f: 659.25, time: 1.5 },
    { f: 783.99, time: 3 },
    { f: 987.77, time: 4.5 },
    { f: 880.0,  time: 7 },
    { f: 659.25, time: 9 },
    { f: 587.33, time: 11 },
  ];

  let left = 0;
  let right = 0;

  for (let n of notes) {
    const noteTime = (t - n.time) % 14;
    if (noteTime >= 0 && noteTime < 5) {
      const env = Math.exp(-noteTime * 1.2);
      const tone = Math.sin(2 * Math.PI * n.f * t) * env * 0.18;
      // reverb tail simulation
      const reverb = 0.3 * Math.sin(2 * Math.PI * n.f * (t - 0.15)) * Math.exp(-noteTime * 0.8);
      left += (tone + reverb) * 0.7;
      right += (tone + reverb) * 0.9;
    }
  }

  return [left, right];
});

fs.writeFileSync('public/samples/ambient-piano.wav', pianoWav);

console.log('Successfully generated 4 high quality sample audio tracks in public/samples/!');
