/**
 * Universal URL Video & Audio Downloader / Stream Processing Utility
 * Pure client-side browser implementation with local Next.js proxy, Web Audio decoding,
 * waveform analysis, trimming, video playback, and instant export.
 */

export interface SampleTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  durationEstimate: string;
  url: string;
}

export const SAMPLE_MUSIC_TRACKS: SampleTrack[] = [
  {
    id: 'lofi-beat',
    title: 'Chill Lo-Fi Summer Beat',
    artist: 'PixelShrink Sound Studio',
    genre: 'Lo-Fi / Hip-Hop',
    durationEstimate: '0:15',
    url: '/samples/lofi-chill.wav',
  },
  {
    id: 'synthwave',
    title: 'Neon Synthwave Dream',
    artist: 'PixelShrink Sound Studio',
    genre: 'Synthwave / Retro',
    durationEstimate: '0:12',
    url: '/samples/synthwave-dream.wav',
  },
  {
    id: 'acoustic-guitar',
    title: 'Warm Acoustic Melody',
    artist: 'PixelShrink Sound Studio',
    genre: 'Acoustic / Folk',
    durationEstimate: '0:10',
    url: '/samples/acoustic-guitar.wav',
  },
  {
    id: 'ambient-piano',
    title: 'Peaceful Ambient Piano',
    artist: 'PixelShrink Sound Studio',
    genre: 'Classical / Ambient',
    durationEstimate: '0:14',
    url: '/samples/ambient-piano.wav',
  },
];

export interface MediaFormatItem {
  id: string;
  format_id?: string;
  itag: number;
  label: string;
  quality: string;
  type: 'video' | 'audio';
  hasAudio: boolean;
  isMuted?: boolean;
  mime?: string;
  filesize?: number | null;
}

export interface MediaInfoResult {
  title: string;
  author: string;
  duration: number;
  durationFormatted: string;
  thumbnail: string;
  provider: string;
  originalUrl?: string;
  formats: MediaFormatItem[];
}

export interface FetchedMediaResult {
  file: File;
  name: string;
  originalUrl: string;
  duration: number;
  sampleRate?: number;
  channels?: number;
  size: number;
  type: string;
  isVideo: boolean;
  isAudio: boolean;
  audioBuffer?: AudioBuffer;
  peaks?: number[];
  mediaUrl: string;
}

// Alias for backwards compatibility
export type FetchedAudioResult = FetchedMediaResult;

/**
 * Generates a direct stream download URL endpoint for immediate browser downloading
 */
export function getDirectStreamDownloadUrl(
  rawUrl: string,
  formatOrType: 'video' | 'audio' | MediaFormatItem = 'video'
): string {
  const normalized = normalizeAudioUrl(rawUrl);
  const cleanUrl = normalized.url;
  const isFormatObj = typeof formatOrType === 'object' && formatOrType !== null;
  const downloadType = isFormatObj ? formatOrType.type : formatOrType;
  const itag = isFormatObj && formatOrType.itag ? formatOrType.itag : undefined;
  const formatId = isFormatObj && (formatOrType.format_id || formatOrType.id) ? (formatOrType.format_id || formatOrType.id) : undefined;
  const quality = isFormatObj && formatOrType.quality ? formatOrType.quality : undefined;

  const params = new URLSearchParams();
  params.set('url', cleanUrl);
  params.set('type', downloadType);
  if (itag) params.set('itag', itag.toString());
  if (formatId) params.set('format_id', formatId);
  if (quality) params.set('quality', quality);

  return `/api/proxy-audio?${params.toString()}`;
}

/**
 * Normalizes input URL by trimming whitespace, stripping quotes, auto-adding https:// if omitted.
 */
export function normalizeAudioUrl(input: string): { url: string; isYouTube?: boolean } {
  let cleaned = input.trim();
  // Strip outer quotes or brackets
  cleaned = cleaned.replace(/^["'`<(\[]+|["'`>)\]]+$/g, '').trim();

  if (!cleaned) {
    throw new Error('Please enter a valid URL.');
  }

  const isYouTube = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|music\.youtube\.com)\//i.test(cleaned);

  // If relative path
  if (cleaned.startsWith('/')) {
    return { url: cleaned, isYouTube: false };
  }

  // Auto-prepend https:// if protocol was omitted
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }

  return { url: cleaned, isYouTube };
}

/**
 * Fetches Video / Audio metadata and available qualities
 */
export async function fetchMediaInfo(rawUrl: string): Promise<MediaInfoResult> {
  const normalized = normalizeAudioUrl(rawUrl);
  const cleanUrl = normalized.url;
  const res = await fetch(`/api/proxy-audio?info=true&url=${encodeURIComponent(cleanUrl)}`);
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Failed to inspect URL: ${res.statusText}`);
  }
  const data: MediaInfoResult = await res.json();
  data.originalUrl = cleanUrl;
  return data;
}

/**
 * Extracts normalized peak values from an AudioBuffer for rendering waveforms
 */
export function extractAudioPeaks(audioBuffer: AudioBuffer, numPeaks: number = 64): number[] {
  const channelData = audioBuffer.getChannelData(0);
  const step = Math.max(1, Math.floor(channelData.length / numPeaks));
  const peaks: number[] = [];

  for (let i = 0; i < numPeaks; i++) {
    const start = i * step;
    const end = Math.min(start + step, channelData.length);
    let max = 0;
    for (let j = start; j < end; j++) {
      const val = Math.abs(channelData[j]);
      if (val > max) max = val;
    }
    peaks.push(Math.min(1, Math.max(0.05, max)));
  }

  return peaks;
}

/**
 * Converts an AudioBuffer into a standard 16-bit PCM WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
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

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Derives a clean filename from a URL or header
 */
export function deriveFilenameFromUrl(url: string, defaultExt: string = 'mp3', customTitle?: string): string {
  if (customTitle) {
    const clean = customTitle.replace(/[^\w\d_ -]/g, '_').trim();
    if (clean) return `${clean}.${defaultExt}`;
  }
  try {
    const isRelative = url.startsWith('/');
    const parsed = isRelative ? new URL(url, window.location.origin) : new URL(url);
    const pathname = parsed.pathname;
    const lastSegment = pathname.split('/').filter(Boolean).pop() || '';
    if (lastSegment && (lastSegment.includes('.') || lastSegment.length > 3)) {
      const cleanName = decodeURIComponent(lastSegment).replace(/[^\w\d_.-]/g, '_');
      if (cleanName.includes('.')) return cleanName;
      return `${cleanName}.${defaultExt}`;
    }
  } catch {
    // fallback
  }
  return `media_download_${Date.now()}.${defaultExt}`;
}

/**
 * Fetches Video or Audio media from ANY URL (YouTube, Drive, Dropbox, Direct Streams)
 */
export async function downloadMediaFromUrl(
  rawUrl: string,
  formatOrType: 'video' | 'audio' | MediaFormatItem = 'video',
  onProgress?: (status: string, percent: number) => void
): Promise<FetchedMediaResult> {
  const normalized = normalizeAudioUrl(rawUrl);
  const cleanUrl = normalized.url;
  const isRelative = cleanUrl.startsWith('/');

  const isFormatObj = typeof formatOrType === 'object' && formatOrType !== null;
  const downloadType = isFormatObj ? formatOrType.type : formatOrType;
  const itag = isFormatObj && formatOrType.itag ? formatOrType.itag : undefined;
  const quality = isFormatObj && formatOrType.quality ? formatOrType.quality : undefined;
  const formatId = isFormatObj && (formatOrType.format_id || formatOrType.id) ? (formatOrType.format_id || formatOrType.id) : undefined;
  const formatLabel = isFormatObj && formatOrType.label ? formatOrType.label : undefined;
  const isMuted = isFormatObj ? !!formatOrType.isMuted : false;

  // Build proxy query params
  const proxyParams = new URLSearchParams();
  proxyParams.set('url', cleanUrl);
  proxyParams.set('type', downloadType);
  if (itag) proxyParams.set('itag', itag.toString());
  if (formatId) proxyParams.set('format_id', formatId);
  if (quality) proxyParams.set('quality', quality);
  if (formatLabel) proxyParams.set('label', formatLabel);
  if (isMuted) proxyParams.set('muted', 'true');

  // Define strategy endpoints based on provider type
  const endpoints: { type: string; url: string; label: string }[] = [];

  if (isRelative) {
    endpoints.push({ type: 'local', url: cleanUrl, label: 'Local Asset' });
  } else if (normalized.isYouTube || cleanUrl.includes('drive.google.com') || cleanUrl.includes('dropbox.com') || cleanUrl.includes('onedrive.')) {
    // Specialized providers MUST use our server-side extractor proxy
    endpoints.push({
      type: 'internal-proxy',
      url: `/api/proxy-audio?${proxyParams.toString()}`,
      label: 'Media Extractor Stream Engine',
    });
  } else {
    // Direct audio/video web links
    endpoints.push({
      type: 'internal-proxy',
      url: `/api/proxy-audio?${proxyParams.toString()}`,
      label: 'Internal Stream Proxy',
    });
    endpoints.push({ type: 'direct', url: cleanUrl, label: 'Direct Media Stream' });
    endpoints.push({
      type: 'proxy1',
      url: `https://api.allorigins.win/raw?url=${encodeURIComponent(cleanUrl)}`,
      label: 'CORS Mirror',
    });
  }

  let arrayBuffer: ArrayBuffer | null = null;
  let detectedType = downloadType === 'video' ? 'video/mp4' : 'audio/mpeg';
  let serverMediaTitle: string | undefined;
  let serverMediaDuration = 0;

  if (onProgress) {
    const labelText = formatLabel ? ` (${formatLabel})` : '';
    if (normalized.isYouTube) {
      onProgress(`Downloading YouTube ${downloadType === 'video' ? 'Video' : 'Audio'}${labelText}...`, 25);
    } else if (cleanUrl.includes('drive.google.com')) {
      onProgress('Resolving Google Drive stream...', 25);
    } else {
      onProgress('Connecting to media stream...', 25);
    }
  }

  let lastError: Error | null = null;

  for (let i = 0; i < endpoints.length; i++) {
    const endpoint = endpoints[i];
    try {
      if (onProgress && i > 0) {
        onProgress(`Connecting via alternative stream route (${endpoint.label})...`, 40 + i * 20);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(endpoint.url, {
        signal: controller.signal,
        headers: {
          Accept: 'video/*,audio/*,application/octet-stream,*/*',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errMsg = `HTTP error ${response.status} (${response.statusText})`;
        try {
          const errJson = await response.json();
          if (errJson.error) errMsg = errJson.error;
        } catch {
          // ignore
        }
        if (errMsg.includes('keyless_legacy_url')) {
          errMsg = "This Google Drive file is restricted or requires authentication. Please set the file's share permissions in Google Drive to 'Anyone with the link can view' or upload the file directly.";
        }
        throw new Error(errMsg);
      }

      const rawTitle = response.headers.get('x-media-title') || response.headers.get('x-audio-title');
      if (rawTitle) {
        try {
          serverMediaTitle = decodeURIComponent(rawTitle);
        } catch {
          serverMediaTitle = rawTitle;
        }
      }

      const durStr = response.headers.get('x-media-duration') || response.headers.get('x-audio-duration');
      if (durStr) {
        serverMediaDuration = parseFloat(durStr) || 0;
      }

      const contentType = response.headers.get('content-type');
      if (contentType) {
        if (contentType.includes('text/html')) {
          throw new Error('The URL returned an HTML webpage instead of a media stream.');
        }
        if (contentType.includes('audio') || contentType.includes('video')) {
          detectedType = contentType.split(';')[0];
        }
      }

      arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer && arrayBuffer.byteLength > 0) {
        break; // Successfully downloaded
      }
    } catch (err: any) {
      lastError = err;
      // continue to next fallback
    }
  }

  if (!arrayBuffer || arrayBuffer.byteLength === 0) {
    throw new Error(
      lastError?.message ||
        'Failed to fetch media stream. Please check the URL or try uploading the file directly.'
    );
  }

  const isVideo = detectedType.includes('video');
  const isAudio = !isVideo;

  const derivedName = deriveFilenameFromUrl(
    cleanUrl,
    isVideo ? 'mp4' : detectedType.includes('wav') ? 'wav' : 'mp3',
    serverMediaTitle
  );

  const blob = new Blob([arrayBuffer], { type: detectedType });
  const file = new File([blob], derivedName, {
    type: detectedType,
    lastModified: Date.now(),
  });

  const mediaUrl = URL.createObjectURL(blob);

  // If audio, decode with Web Audio API for waveform peaks
  let audioBuffer: AudioBuffer | undefined;
  let peaks: number[] | undefined;
  let duration = serverMediaDuration;

  if (isAudio) {
    if (onProgress) onProgress('Decoding audio waveform with Web Audio...', 75);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
        duration = audioBuffer.duration;
        peaks = extractAudioPeaks(audioBuffer, 64);
        await audioCtx.close();
      }
    } catch (e) {
      console.warn('Audio decoding waveform note:', e);
    }
  }

  if (onProgress) onProgress('Media ready!', 100);

  return {
    file,
    name: derivedName,
    originalUrl: cleanUrl,
    duration,
    sampleRate: audioBuffer?.sampleRate,
    channels: audioBuffer?.numberOfChannels,
    size: arrayBuffer.byteLength,
    type: detectedType,
    isVideo,
    isAudio,
    audioBuffer,
    peaks,
    mediaUrl,
  };
}

// Backwards-compatible alias
export const downloadAudioFromUrl = downloadMediaFromUrl;

/**
 * Trims an AudioBuffer between startTime and endTime and exports a new WAV File
 */
export async function trimAudio(
  sourceBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  baseFilename: string
): Promise<{ file: File; audioUrl: string; duration: number; peaks: number[] }> {
  const start = Math.max(0, startTime);
  const end = Math.min(sourceBuffer.duration, Math.max(start + 0.1, endTime));
  const duration = end - start;
  const sampleRate = sourceBuffer.sampleRate;
  const numChannels = sourceBuffer.numberOfChannels;

  const startOffset = Math.floor(start * sampleRate);
  const endOffset = Math.floor(end * sampleRate);
  const frameCount = endOffset - startOffset;

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const audioCtx = new AudioCtx();
  const trimmedBuffer = audioCtx.createBuffer(numChannels, frameCount, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = sourceBuffer.getChannelData(ch);
    const destData = trimmedBuffer.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      destData[i] = srcData[startOffset + i];
    }
  }

  const wavBlob = audioBufferToWavBlob(trimmedBuffer);
  const peaks = extractAudioPeaks(trimmedBuffer, 64);
  await audioCtx.close();

  const dotIdx = baseFilename.lastIndexOf('.');
  const rawName = dotIdx !== -1 ? baseFilename.substring(0, dotIdx) : baseFilename;
  const trimmedName = `${rawName}_trimmed.wav`;

  const file = new File([wavBlob], trimmedName, {
    type: 'audio/wav',
    lastModified: Date.now(),
  });

  return {
    file,
    audioUrl: URL.createObjectURL(wavBlob),
    duration,
    peaks,
  };
}
