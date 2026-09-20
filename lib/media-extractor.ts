/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV format.
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    for (let i = 0; i < left.length; i++) {
      result[i * 2] = left[i];
      result[i * 2 + 1] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = result.length * bytesPerSample;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  // fmt subchunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  // data subchunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Extracts high-fidelity audio (WAV) directly from a local video or audio file.
 */
export async function extractAudioFromMedia(
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> {
  if (onProgress) onProgress(15);
  const arrayBuffer = await file.arrayBuffer();

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) {
    throw new Error('Web Audio API is not supported in this browser');
  }

  if (onProgress) onProgress(40);
  const audioCtx = new AudioCtx();
  const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  if (onProgress) onProgress(75);
  const wavBlob = audioBufferToWav(audioBuffer);
  await audioCtx.close();

  if (onProgress) onProgress(100);

  const dotIdx = file.name.lastIndexOf('.');
  const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;

  return new File([wavBlob], `${baseName}_audio.wav`, {
    type: 'audio/wav',
    lastModified: Date.now(),
  });
}

/**
 * Extracts snapshot frames from a video file at regular time intervals.
 */
export async function extractFramesFromVideo(
  file: File,
  intervalSeconds: number = 2,
  maxFrames: number = 8,
  onProgress?: (progress: number) => void
): Promise<{ url: string; time: number; name: string; file: File }[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = async () => {
      const duration = video.duration;
      if (!duration || duration <= 0) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Unable to read video timeline length'));
        return;
      }

      const frames: { url: string; time: number; name: string; file: File }[] = [];
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        URL.revokeObjectURL(video.src);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // Compute timestamps to snapshot
      const times: number[] = [];
      for (let t = 0.5; t < duration && times.length < maxFrames; t += intervalSeconds) {
        times.push(t);
      }
      if (times.length === 0) times.push(0);

      const dotIdx = file.name.lastIndexOf('.');
      const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;

      for (let i = 0; i < times.length; i++) {
        const time = times[i];
        await new Promise<void>((seekDone) => {
          video.currentTime = time;
          video.onseeked = () => seekDone();
        });

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frameBlob = await new Promise<Blob>((bRes) => {
          canvas.toBlob((b) => bRes(b || new Blob()), 'image/jpeg', 0.9);
        });

        const frameFile = new File(
          [frameBlob],
          `${baseName}_frame_${i + 1}_${Math.round(time)}s.jpg`,
          { type: 'image/jpeg', lastModified: Date.now() }
        );

        const frameUrl = URL.createObjectURL(frameFile);
        frames.push({
          url: frameUrl,
          time,
          name: frameFile.name,
          file: frameFile,
        });

        if (onProgress) {
          onProgress(Math.round(((i + 1) / times.length) * 100));
        }
      }

      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Could not load video media stream'));
    };
  });
}
